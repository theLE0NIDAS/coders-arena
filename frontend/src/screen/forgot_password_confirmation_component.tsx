import axios, { AxiosError } from "axios";
import React, { useState } from "react";
import { Button, Container, Row, Col, Alert, Spinner } from "react-bootstrap";
import {
  BACKEND_BASE_URL,
  FORGOT_PASSWORD_VERIFICATION_ENDPOINT,
  OJ_TOKEN_KEY,
} from "../common/constants";
import { Link, useNavigate, useParams } from "react-router-dom";

export default () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const { email, token } = useParams();

  const onLoginClick = async () => {
    if (validate()) {
      setBusy(true);
      try {
        const url = `${BACKEND_BASE_URL}/${FORGOT_PASSWORD_VERIFICATION_ENDPOINT}/${email}/${token}`;
        const body = {
          newPassword: password,
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
    //validate email address
    if (password === "") {
      currentErrors = [...currentErrors, "Password is required"];
    } else if (password.length < 6 || password.length > 20) {
      currentErrors = [
        ...currentErrors,
        "Password length must 6 - 20 characters long",
      ];
    } else if (password !== confirmPassword) {
      currentErrors = [...currentErrors, "Both password should match"];
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
              New password
            </label>
            <input
              className="form-control mb-2"
              type="password"
              id="password"
              name="password"
              placeholder="Enter email"
              onChange={(e: React.FormEvent<HTMLInputElement>) =>
                setPassword(e.currentTarget.value)
              }
            />
            <label htmlFor="email" className="mb-2">
              Confirm Password
            </label>
            <input
              className="form-control mb-2"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm password"
              onChange={(e: React.FormEvent<HTMLInputElement>) =>
                setConfirmPassword(e.currentTarget.value)
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
      Password successfully changed, please <Link to={"/login"}>Login</Link>
    </Alert>
  );
};
