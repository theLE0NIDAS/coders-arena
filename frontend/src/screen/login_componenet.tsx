import axios, { AxiosError } from "axios";
import React, { useState } from "react";
import { Button, Container, Row, Col, Alert, Spinner } from "react-bootstrap";
import {
  BACKEND_BASE_URL,
  LOGIN_ENDPOINT,
  OJ_TOKEN_KEY,
} from "../common/constants";
import { Link, useNavigate } from "react-router-dom";
import { useStoreActions } from "../hooks";

const LoginComponent = () => {
  const navigate = useNavigate();
  const setIsLoggedIn = useStoreActions((actions) => actions.setIsLoggedIn);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<boolean>(false);

  const onLoginClick = async () => {
    if (validate()) {
      setBusy(true);
      try {
        const url = `${BACKEND_BASE_URL}/${LOGIN_ENDPOINT}`;
        const body = {
          email: email,
          password: password,
        };
        const apiRes = await axios.post(url, body);
        localStorage.setItem(OJ_TOKEN_KEY, apiRes.data["token"]);
        setIsLoggedIn(true);
        navigate("../", { replace: true });
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
    //validate password
    if (password === "") {
      currentErrors = [...currentErrors, "Password is required"];
    } else if (password.length < 6 || password.length > 20) {
      currentErrors = [
        ...currentErrors,
        "Password should be 6 - 20 characters long.",
      ];
    }
    setErrors([...currentErrors]);
    return currentErrors.length === 0;
  };
  return (
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
            <label htmlFor="password" className="mb-2">
              Password
            </label>
            <input
              className="form-control mb-2"
              type="password"
              id="password"
              name="password"
              placeholder="Enter password"
              onChange={(e: React.FormEvent<HTMLInputElement>) =>
                setPassword(e.currentTarget.value)
              }
            />
            {busy ? (
              <Spinner animation="border" />
            ) : (
              <Button variant="success" onClick={onLoginClick}>
                Login
              </Button>
            )}
            <p className="mt-3">
              Don't have a account yet, <Link to={`/signup`}>Signup</Link> or{" "}
              <Link to={`/forgotPassword`}>Forgot password</Link>
            </p>
          </div>
        </Col>
        <Col xs={4}></Col>
      </Row>
    </Container>
  );
};

export default LoginComponent;
