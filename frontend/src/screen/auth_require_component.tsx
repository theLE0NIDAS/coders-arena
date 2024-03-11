import { Container, Row, Col, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";

const AuthRequiredComponent = () => {
  return (
    <Container>
      <Row>
        <Col>
          <Alert variant="danger" className="w-25 mx-auto mt-5">
            Authentication token required to access this route, Please &nbsp;
            <Link to="/login">Login</Link>&nbsp; or{" "}
            <Link to="/signup">Create New Account</Link>
          </Alert>
        </Col>
      </Row>
    </Container>
  );
};

export default AuthRequiredComponent;
