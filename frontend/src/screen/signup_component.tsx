import axios, { AxiosError } from "axios";
import { useState } from "react";
import { Alert, Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { BACKEND_BASE_URL, SIGNUP_ENDPOINT } from "../common/constants";

const SignupComponent = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errors, setErrors] = useState<Array<string>>([]);
  const [busy, setBusy] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
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
    } else if (confirmPassword !== password) {
      currentErrors = [...currentErrors, "Both passwords should match"];
    }
    setErrors(currentErrors);
    return currentErrors.length === 0;
  };
  const onSignupClick = async () => {
    if (validate()) {
      setBusy(true);
      try {
        const url = `${BACKEND_BASE_URL}/${SIGNUP_ENDPOINT}`;
        const body = {
          email: email,
          password: password,
        };
        await axios.post(url, body);
        setDone(true);
      } catch (e: unknown) {
        if (e instanceof AxiosError) {
          setErrors([e.response?.data]);
        } else {
          console.log(e);
        }
      } finally {
        setBusy(false);
      }
    }
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
            <label htmlFor="confirmPassword" className="mb-2">
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
              <Button variant="success" onClick={onSignupClick}>
                Sign up
              </Button>
            )}
          </div>
        </Col>
        <Col xs={4}></Col>
      </Row>
    </Container>
  ) : (
    <Alert className="mt-4" variant="success">
      A confirmation email has been sent to your registered email, please click
      on given link to verify email
    </Alert>
  );
};

export default SignupComponent;
