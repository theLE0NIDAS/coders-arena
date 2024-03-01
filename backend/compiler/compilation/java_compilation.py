from datetime import datetime
from compiler.model.out.judge_response import CompilerJsonResponse
from compiler.common.verdict_code import VerdictCode
from compiler.models import Problem, Submission, User
import os
import uuid
from rest_framework.parsers import JSONParser
import shutil


def javaCompilation(problem, user, body):
    # create a folder with unique name where all operation goes
    folderName = "".join(str(uuid.uuid1()).split("-"))
    lang = "java"
    extension = ".java"
    os.mkdir(folderName)
    codeFile = "submission/{}/{}{}".format(lang, folderName, extension)
    # create a cpp file and all received code
    javaFileName = "Code.java"
    javaCompiledFileName = "Code"

    receivedCode = body["codes"]

    # create a cpp file and put all received code
    javaFileHandler = open(folderName+"/"+javaFileName, "w")
    javaFileHandler.write(receivedCode)
    javaFileHandler.close()

    compilationErrorFileName = "err.txt"
    # command : docker --rm -v <current path to mount>:<container path to mount> -w <working directory> openjdk:11 bash -c "javac Code.java 2> err.txt"
    currentWorkingDirectory = os.getcwd()
    compilationCommandString = "docker run --rm -v \"{}\\{}\":/usr/share/cpp -w /usr/share/cpp openjdk:11 bash -c \"javac {} 2> {}\"".format(
        currentWorkingDirectory, folderName, javaFileName, compilationErrorFileName, compilationErrorFileName)
    compilationCommand = os.system(compilationCommandString)

    if(compilationCommand != 0):
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
            language="java"
        )
        submissionWithCE.save()
        errorFile = open(folderName+"/"+compilationErrorFileName, "r")
        lines = errorFile.read()
        errorFile.close()
        shutil.rmtree(folderName)
        return CompilerJsonResponse(
            result="Compilation error",
            details=lines,
            status=406,
            verdictCode=VerdictCode.CompilationError
        ).build()
    else:
        testcasesFile = open(problem.testcase.path, "r")
        answersFile = open(problem.answer.path, "r")

        noOfTestCase = 0

        for testcase, answer in zip(testcasesFile, answersFile):
            noOfTestCase += 1
            inputFile = open(folderName+"/in.txt".format(id), "w")
            inputFile.write(testcase)
            inputFile.close()

            errFile = "err.txt"

            exec = os.system(
                "docker run --rm -v \"{}\\{}\":/usr/share/cpp -w /usr/share/cpp openjdk:11 bash -c \"timeout {} java {} < {} > {} 2> {}\"".format(currentWorkingDirectory, folderName, problem.timeout, javaCompiledFileName, "in.txt", "out.txt", errFile))

            if(exec != 0):

                errorFileHandler = open(folderName+"/"+errFile, "r")
                errorLine = errorFileHandler.read()
                errorFileHandler.close()

                if(errorLine == ""):
                    f1 = open(codeFile, "w")
                    f1.write(receivedCode)
                    f1.close()
                    submissionWithTLE = Submission(
                        user=user,
                        verdict="Time limit exception on {} testcase".format(
                            noOfTestCase),
                        verdictCode=VerdictCode.TimeLimitException,
                        submittedOn=datetime.now(),
                        problem=problem,
                        code=codeFile,
                        language="java"
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
                    f1 = open(codeFile, "w")
                    f1.write(receivedCode)
                    f1.close()
                    submissionWithTLE = Submission(
                        user=user,
                        verdict="Runtime error on {} testcase".format(
                            noOfTestCase),
                        verdictCode=VerdictCode.RuntimeException,
                        submittedOn=datetime.now(),
                        problem=problem,
                        code=codeFile,
                        language="java"
                    )
                    submissionWithTLE.save()
                    shutil.rmtree(folderName)
                    return CompilerJsonResponse(
                        result="Runtime error",
                        details="Runtime error occured on testcase {}, please check your solution".format(
                            noOfTestCase),
                        status=406,
                        verdictCode=VerdictCode.RuntimeException
                    ).build()
            else:
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
                        language="java"
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
            language="java"
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
