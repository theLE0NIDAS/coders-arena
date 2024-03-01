from datetime import datetime
from compiler.model.out.judge_response import CompilerJsonResponse
from compiler.common.verdict_code import VerdictCode
from compiler.models import Problem, Submission, User
import os
import uuid
from rest_framework.parsers import JSONParser
import shutil


def pythonCompilation(problem, user, body):
    # create a folder with unique name where all operation goes
    folderName = "".join(str(uuid.uuid1()).split("-"))
    lang = "python"
    extension = ".py"
    os.mkdir(folderName)

    # create a cpp file and all received code
    pythonFileName = "code.py"

    receivedCode = body["codes"]
    codeFile = "submission/{}/{}{}".format(lang, folderName, extension)
    # create a cpp file and put all received code
    pythonFileHandler = open(folderName+"/"+pythonFileName, "w")
    pythonFileHandler.write(receivedCode)
    pythonFileHandler.close()
    currentWorkingDirectory = os.getcwd()

    # command : docker --rm -v <current path to mount>:<container path to mount> -w <working directory> python:3 bash -c "timeout sec python code.py < in.txt > out.txt 2> err.txt"

    testcasesFile = open(problem.testcase.path, "r")
    answersFile = open(problem.answer.path, "r")

    noOfTestCase = 0

    for testcase, answer in zip(testcasesFile, answersFile):
        noOfTestCase += 1
        inputFile = open(folderName+"/in.txt".format(id), "w")
        inputFile.write(testcase)
        inputFile.close()

        runCommandString = "docker run --rm -v \"{}\\{}\":/usr/share/cpp -w /usr/share/cpp python:3 bash -c \"timeout {} python {} < {} > {} 2> {}\"".format(
            currentWorkingDirectory, folderName, problem.timeout, pythonFileName, "in.txt", "out.txt", "err.txt")
        compilationCommand = os.system(runCommandString)
        if(compilationCommand != 0):
            errorFileHandler = open(folderName+"/err.txt", "r")
            errorLines = errorFileHandler.read()
            errorFileHandler.close()

            if(errorLines == ""):

                f1 = open(codeFile, "w")
                f1.write(receivedCode)
                f1.close()
                submissionWithTLE = Submission(
                    user=user,
                    verdict="Time limit exception on testcase {}".format(
                            noOfTestCase),
                    verdictCode=VerdictCode.TimeLimitException,
                    submittedOn=datetime.now(),
                    problem=problem,
                    code=codeFile,
                    language="python"
                )
                submissionWithTLE.save()
                shutil.rmtree(folderName)
                return CompilerJsonResponse(
                    result="Time limit exception",
                    details="Time limit has been reached for testcase {}, please try to optimize your solution".format(
                        noOfTestCase),
                    status=406,
                    verdictCode=VerdictCode.TimeLimitException
                ).build()
            else:
                # compilation error occured
                f1 = open(codeFile, "w")
                f1.write(receivedCode)
                f1.close()
                submissionWithCE = Submission(
                    user=user,
                    verdict="Compilation error",
                    verdictCode=VerdictCode.CompilationError,
                    submittedOn=datetime.now(),
                    problem=problem,
                    code=codeFile,
                    language="python"
                )
                submissionWithCE.save()
                shutil.rmtree(folderName)
                return CompilerJsonResponse(
                    result="Compilation error",
                    details=errorLines,
                    status=406,
                    verdictCode=VerdictCode.CompilationError
                ).build()
        else:
            # check output with expected file
            output = open(folderName+"/out.txt".format(id), "r")
            outputRes = output.read()
            output.close()

            outputRes = outputRes.strip()
            answer = answer.strip()

            if(outputRes != answer):
                f1 = open(codeFile, "w")
                f1.write(receivedCode)
                f1.close()
                submissionWithWA = Submission(
                    user=user,
                    verdict="Wrong answer on testcase {}".format(
                        noOfTestCase),
                    verdictCode=VerdictCode.WrongAnswer,
                    submittedOn=datetime.now(),
                    problem=problem,
                    code=codeFile,
                    language="python"
                )
                submissionWithWA.save()
                shutil.rmtree(folderName)
                return CompilerJsonResponse(
                    result="Wrong answer",
                    details="Wrong answer on testcase {}".format(
                        noOfTestCase),
                    status=406,
                    verdictCode=VerdictCode.WrongAnswer
                ).build()
    f1 = open(codeFile, "w")
    f1.write(receivedCode)
    f1.close()
    submission = Submission(
        user=user,
        verdict="All clear",
        verdictCode=VerdictCode.AllClear,
        submittedOn=datetime.now(),
        problem=problem,
        code=codeFile,
        language="python"
    )
    submission.save()
    shutil.rmtree(folderName)
    return CompilerJsonResponse(
        result="All clear",
        details="All {} testcases have been passed successfully".format(
            noOfTestCase),
        status=201,
        verdictCode=VerdictCode.AllClear
    ).build()
