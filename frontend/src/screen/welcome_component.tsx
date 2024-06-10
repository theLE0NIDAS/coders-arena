import { Container, Row, Col, Alert } from "react-bootstrap";
import './WelcomeComponent.css'; // Import the CSS file

const WelcomeComponent = () => {
  return (
    <Container fluid className="welcome-container">
      <Row>
        <Col>
          <Alert variant="info" className="w-100 mx-auto alert">
            Welcome to Coder's Arena
          </Alert>
        </Col>
      </Row>
    </Container>
  );
};

export default WelcomeComponent;

