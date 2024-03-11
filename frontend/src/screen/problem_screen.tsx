import React, { useState, useEffect, BaseSyntheticEvent } from "react";
import { useParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import {
  Alert,
  Button,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Tab,
  Table,
  Tabs,
} from "react-bootstrap";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { oneDark } from "@codemirror/theme-one-dark";
import ProblemDetailProps from "../model/problem_detail_props";
import SubmissionResponse from "../model/submission_response";
import VerdictCode from "../common/verdict_code";
import { cppTemplate, javaTemplate, pythonTemplate } from "./language_template";
import { BACKEND_BASE_URL, OJ_TOKEN_KEY } from "../common/constants";
import ProblemSubmission from "../model/in/problem_submission";
import { useNavigate } from "react-router-dom";
import { darcula } from "@uiw/codemirror-theme-darcula";
import { abcdef } from "@uiw/codemirror-theme-abcdef";
import { bespin } from "@uiw/codemirror-theme-bespin";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { duotoneDark, duotoneLight } from "@uiw/codemirror-theme-duotone";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { eclipse } from "@uiw/codemirror-theme-eclipse";
import { FiRefreshCw } from "react-icons/fi";

const RecentSubmissionComponent = () => {
  let navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Array<ProblemSubmission>>([]);
  const [busy, setBusy] = useState<boolean>(false);
  const { problemId } = useParams();

  const convertVerdictCodeToText = (code: number) => {
    switch (code) {
      case VerdictCode.AllClear:
        return <p className="easy">Accepted</p>;
      case VerdictCode.CompilationError:
        return <p className="hard">Compilation error</p>;
      case VerdictCode.WrongAnswer:
        return <p className="hard">Wrong answer</p>;
      case VerdictCode.TimeLimitException:
        return <p className="hard">Time limit exception</p>;
      case VerdictCode.RuntimeException:
        return <p>Runtime exception</p>;
    }
  };
  const renderDateTime = (data: string) => {
    const section = data.split("T");
    const date = section[0].split("-").join("/");
    const time = section[1].split(".")[0];
    return `${date} ${time}`;
  };
  const fetchRecentSubmission = async () => {
    setBusy(true);
    const data = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(OJ_TOKEN_KEY)}`,
      },
    };
    if (localStorage.getItem(OJ_TOKEN_KEY) === null) {
      alert("Authetication token required");
      setBusy(false);
      return;
    }
    try {
      const recentSubmissionRes = await axios.get(
        `${BACKEND_BASE_URL}/problems/${problemId}/submission`,
        data
      );
      setSubmissions(recentSubmissionRes.data);
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.message);
      } else {
        console.log(e);
      }
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    fetchRecentSubmission();
  }, []);
  return busy ? (
    <Spinner animation="border"></Spinner>
  ) : submissions.length == 0 ? (
    <div>
      <Button
        className="mb-3 float-right"
        variant="primary"
        onClick={fetchRecentSubmission}
      >
        <FiRefreshCw />
      </Button>
      <p>No recent submissions found</p>
    </div>
  ) : (
    <div>
      <Button
        className="mb-3 float-right"
        variant="primary"
        onClick={fetchRecentSubmission}
      >
        <FiRefreshCw />
      </Button>
      <Table bordered striped hover>
        <thead>
          <tr>
            <td>Language</td>
            <td>Submitted on</td>
            <td>Verdict</td>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub: ProblemSubmission) => (
            <tr
              key={sub.id}
              className="pointer"
              onClick={() => {
                navigate(`../../submission/${sub.id}`);
              }}
            >
              <td>{sub.language}</td>
              <td>{renderDateTime(sub.submittedOn)}</td>
              <td>{convertVerdictCodeToText(sub.verdictCode)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

const ProblemScreen = () => {
  let { problemId } = useParams();
  const [problem, setProblem] = useState<ProblemDetailProps | null>(null);
  const [language, setLanguage] = useState("cpp");
  const [theme, setTheme] = useState("one-dark");
  const [tabActiveKey, setTabActiveKey] = useState<string>("description");
  const [submissionRes, setSubmissionRes] = useState<SubmissionResponse | null>(
    null
  );
  const [busy, setBusy] = useState<boolean>(false);
  enum submitStatusEnum {
    notStarted,
    submitting,
    submitted,
  }
  const [submitStatus, setSubmitStatus] = useState<submitStatusEnum>(
    submitStatusEnum.notStarted
  );

  let code: string = "";
  const fetchProblem = async () => {
    setBusy(true);
    if (localStorage.getItem(OJ_TOKEN_KEY) === null) {
      alert("Authetication token required");
      setBusy(false);
      return;
    }
    try {
      let res = await axios.get(`${BACKEND_BASE_URL}/problems/${problemId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(OJ_TOKEN_KEY)}`,
        },
      });
      setProblem(res.data);
      console.log(res);
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.message);
      } else {
        console.log(e);
      }
    } finally {
      setBusy(false);
    }
  };
  const renderSubmissionTab = () => {
    if (submitStatus == submitStatusEnum.notStarted) {
      return <p>Please submit a solution</p>;
    } else if (submitStatus == submitStatusEnum.submitting) {
      return (
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      );
    } else {
      if (submissionRes?.verdictCode == VerdictCode.AllClear) {
        return (
          <Alert key={"success"} variant={"success"}>
            <h5>{submissionRes.result}</h5>
            <p>{submissionRes.details}</p>
          </Alert>
        );
      } else if (submissionRes?.verdictCode == VerdictCode.WrongAnswer) {
        return (
          <Alert key={"danger"} variant={"danger"}>
            <h5>{submissionRes.result}</h5>
            <p>{submissionRes.details}</p>
          </Alert>
        );
      } else if (submissionRes?.verdictCode == VerdictCode.CompilationError) {
        return (
          <Alert key={"danger"} variant={"danger"}>
            <h5>{submissionRes.result}</h5>
            <p>{submissionRes.details}</p>
          </Alert>
        );
      } else if (submissionRes?.verdictCode == VerdictCode.RuntimeException) {
        return (
          <Alert key={"danger"} variant={"danger"}>
            <h5>{submissionRes.result}</h5>
            <p>{submissionRes.details}</p>
          </Alert>
        );
      } else if (submissionRes?.verdictCode == VerdictCode.TimeLimitException) {
        return (
          <Alert key={"danger"} variant={"danger"}>
            <h5>{submissionRes.result}</h5>
            <p>{submissionRes.details}</p>
          </Alert>
        );
      }
    }
  };
  const languageSupport = () => {
    if (language == "cpp") {
      return [cpp()];
    } else if (language == "java") {
      return [java()];
    } else {
      return [python()];
    }
  };

  const themeSupport = () => {
    switch (theme) {
      case "one-dark":
        return oneDark;
      case "abcdef":
        return abcdef;
      case "okaidia":
        return okaidia;
      case "bespin":
        return bespin;
      case "duotone-dark":
        return duotoneDark;
      case "duotone-light":
        return duotoneLight;
      case "dracula":
        return dracula;
      case "eclipse":
        return eclipse;
      case "darcula":
        return darcula;
      default:
        return oneDark;
    }
  };
  const setLanguageSupport = (e: BaseSyntheticEvent) => {
    console.log(e);
  };
  const setLanguageTemplate = () => {
    if (language == "cpp") return (code = cppTemplate);
    else if (language == "java") return (code = javaTemplate);
    else return (code = pythonTemplate);
  };
  useEffect(() => {
    fetchProblem();
  }, []);

  const submitCode = async () => {
    if (localStorage.getItem(OJ_TOKEN_KEY) === null) {
      alert("Authetication token required");
      return;
    }
    setTabActiveKey("submission");
    setSubmitStatus(submitStatusEnum.submitting);
    let data = {
      codes: code,
      language: language,
    };

    try {
      let res = await axios.post(
        `${BACKEND_BASE_URL}/problems/${problemId}/submission`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(OJ_TOKEN_KEY)}`,
          },
        }
      );
      setSubmissionRes(res.data);
    } catch (e: any) {
      console.log(e);
      if (e.response.status == 406) {
        setSubmissionRes(e.response.data);
      } else {
        console.log(e);
      }
    }

    //do something with res
    setSubmitStatus(submitStatusEnum.submitted);
  };

  const renderProblem = () => {
    if (busy || problem === null) {
      if (problem === null) {
        return <div></div>;
      } else {
        return (
          <Row>
            <Col>
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </Col>
          </Row>
        );
      }
    } else {
      return (
        <Row>
          <Col>
            <h4>{`${problem.id}. ${problem.title}`}</h4>

            <p className={problem.level}>{problem.level}</p>
            <hr />
            <p>{problem.description}</p>
            <br />
            <h6>Input 1</h6>
            <div className={["basicBlock", "p-3"].join(" ")}>
              {problem.input1}
            </div>
            <h6>Output 1</h6>
            <div className={["basicBlock", "p-3"].join(" ")}>
              {problem.output1}
            </div>
            <h6>Input 2</h6>
            <div className={["basicBlock", "p-3"].join(" ")}>
              {problem.input2}
            </div>
            <h6>Output 2</h6>
            <div className={["basicBlock", "p-3"].join(" ")}>
              {problem.output2}
            </div>
            <h6>Constraints</h6>
            <div className={["basicBlock", "p-3"].join(" ")}>
              {problem.constraint.toString()}
            </div>
          </Col>
        </Row>
      );
    }
  };

  return (
    <Container fluid>
      <Row className={"py-2"}>
        <Col md={12} lg={6}>
          <Tabs
            activeKey={tabActiveKey}
            onSelect={(k) => {
              k != null && setTabActiveKey(k);
            }}
            className="mb-3"
          >
            <Tab eventKey="description" title="Description">
              {renderProblem()}
            </Tab>
            <Tab eventKey="submission" title="Submission">
              {renderSubmissionTab()}
            </Tab>
            <Tab eventKey="recent_submission" title="Recent submissions">
              <RecentSubmissionComponent />
            </Tab>
          </Tabs>
        </Col>
        <Col md={12} lg={6}>
          <Row className={"py-2"}>
            <Col>
              <Form.Select onChange={(e) => setLanguage(e.target.value)}>
                <option value="cpp">c++</option>
                <option value="java">java</option>
                <option value="python">python3</option>
              </Form.Select>
            </Col>
            <Col>
              <Form.Select onChange={(e) => setTheme(e.target.value)}>
                <option>one-dark</option>
                <option>darcula</option>
                <option>okaidia</option>
                <option>bespin</option>
                <option>duotone-dark</option>
                <option>duotone-light</option>
                <option>dracula</option>
                <option>eclipse</option>
              </Form.Select>
            </Col>
          </Row>
          <CodeMirror
            value={setLanguageTemplate()}
            height="500px"
            theme={themeSupport()}
            extensions={languageSupport()}
            onChange={(value, viewUpdate) => (code = value)}
          />
        </Col>
      </Row>
      <Row>
        <Col></Col>
        <Col>
          <Button variant="primary" onClick={submitCode}>
            Submit
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default ProblemScreen;
