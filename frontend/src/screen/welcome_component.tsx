import { Container, Row, Col, Alert } from "react-bootstrap";

const WelcomeComponent = () => {
  return (
    <Container>
      <Row>
        <Col>
          <Alert variant="info" className="w-50 mx-auto mt-5">
            Welcome to Creatish Online Judge
          </Alert>
        </Col>
      </Row>
    </Container>
  );
};

export default WelcomeComponent;
