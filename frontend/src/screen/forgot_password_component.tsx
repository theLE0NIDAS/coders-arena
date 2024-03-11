import axios, { AxiosError } from "axios";
import React, { useState } from "react";
import { Button, Container, Row, Col, Alert, Spinner } from "react-bootstrap";
import {
  BACKEND_BASE_URL,
  FORGOT_PASSWORD_ENDPOINT,
  OJ_TOKEN_KEY,
} from "../common/constants";
import { Link, useNavigate } from "react-router-dom";

export default () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);

  const onLoginClick = async () => {
    if (validate()) {
      setBusy(true);
      try {
        const url = `${BACKEND_BASE_URL}/${FORGOT_PASSWORD_ENDPOINT}`;
        const body = {
          email: email,
        };
        await axios.post(url, body);
        setDone(true);
      } catch (e: unknown) {
        if (e instanceof AxiosError) {
          setErrors([e.response?.data]);
        } else {
          console.log("unhandled error");
          console.log(e);
        }
      } finally {
        setBusy(false);
      }
    }
  };
  const validate = (): boolean => {
    let currentErrors: Array<string> = [];
    const emailRegex = new RegExp(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/);
    //validate email address
    if (email === "") {
      currentErrors = [...currentErrors, "Email is required"];
    } else if (!emailRegex.test(email)) {
      currentErrors = [...currentErrors, "Invalid email"];
    }
    setErrors([...currentErrors]);
    return currentErrors.length === 0;
  };
  return done === false ? (
    <Container className="mt-5">
      <Row>
        <Col xs={4}></Col>
        <Col xs={4}>
          {errors.map((error) => (
            <Alert key={error} variant="danger">
              {error}
            </Alert>
          ))}

          <div className="form-group">
            <label htmlFor="email" className="mb-2">
              Email address
            </label>
            <input
              className="form-control mb-2"
              type="text"
              id="email"
              name="email"
              placeholder="Enter email"
              onChange={(e: React.FormEvent<HTMLInputElement>) =>
                setEmail(e.currentTarget.value)
              }
            />

            {busy ? (
              <Spinner animation="border" />
            ) : (
              <Button variant="success" onClick={onLoginClick}>
                Get verification link
              </Button>
            )}
          </div>
        </Col>
        <Col xs={4}></Col>
      </Row>
    </Container>
  ) : (
    <Alert variant="success">
      Email verification link has been sent to registered email
    </Alert>
  );
};
