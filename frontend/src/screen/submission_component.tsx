import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Col, Container, Row, Spinner } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { BACKEND_BASE_URL, OJ_TOKEN_KEY } from "../common/constants";
import ProblemSubmissionDetailed from "../model/in/problem_submission_detailed";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";

const SubmissionComponent = () => {
  const { id } = useParams();
  const [busy, setBusy] = useState<boolean>(false);
  const [submission, setSubmission] =
    useState<ProblemSubmissionDetailed | null>(null);
  useEffect(() => {
    fetchSubmission();
  }, []);

  const fetchSubmission = async () => {
    if (localStorage.getItem(OJ_TOKEN_KEY) === null) {
      alert("Authetication token required to access this page");
      return;
    }
    setBusy(true);
    try {
      const data = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(OJ_TOKEN_KEY)}`,
        },
      };
      const res = await axios.get(`${BACKEND_BASE_URL}/submission/${id}`, data);
      setSubmission(res.data);
      console.log(res.data);
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
  const languageSupport = (language: string | null) => {
    if (language == "c++") {
      return [cpp()];
    } else if (language == "java") {
      return [java()];
    } else {
      return [python()];
    }
  };
  return busy ? (
    <Spinner animation="border"></Spinner>
  ) : (
    submission && (
      <Container>
        <Row>
          <Col>
            <p>
              <b>Language</b> : {submission.language}
            </p>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              <b>Submitted on</b> : {submission.submittedOn}
            </p>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              <b>Verdict</b> : {submission.verdict}
            </p>
          </Col>
        </Row>
        <Row>
          <CodeMirror
            value={submission.codes}
            height="500px"
            theme={oneDark}
            extensions={languageSupport(submission?.language)}
          />
        </Row>
      </Container>
    )
  );
};
export default SubmissionComponent;
