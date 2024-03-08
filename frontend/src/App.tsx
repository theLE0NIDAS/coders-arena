import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import ProblemScreen from "./screen/problem_screen";
import ProblemsScreen from "./screen/problems_screen";
import LoginComponent from "./screen/login_componenet";
import { OJ_TOKEN_KEY } from "./common/constants";
import WelcomeComponent from "./screen/welcome_component";
import { Action, action, createStore, StoreProvider } from "easy-peasy";
import SignupComponent from "./screen/signup_component";
import ForgotPasswordComponent from "./screen/forgot_password_component";
import ForgotPasswordConfirmationComponent from "./screen/forgot_password_confirmation_component";
import { useStoreActions, useStoreState } from "./hooks";
import SubmissionComponent from "./screen/submission_component";
import PrivateRouteWrapper from "./component/private_route_wrapper";

export interface StoreModel {
  isLoggedIn: boolean;
  setIsLoggedIn: Action<this, boolean>;
}

const store = createStore<StoreModel>({
  isLoggedIn: localStorage.getItem(OJ_TOKEN_KEY) === null ? false : true,
  setIsLoggedIn: action((state, payload) => {
    state.isLoggedIn = payload;
  }),
});

const App = () => {
  const setIsLoggedIn = useStoreActions((actions) => actions.setIsLoggedIn);
  const isLoggedIn = useStoreState((state) => state.isLoggedIn);
  return (
    <Router>
      <Navbar bg="dark" expand="lg">
        <Container fluid>
          <Navbar.Brand><Link to="/" className="white" >Creatish Judge</Link></Navbar.Brand>
          <Nav>
            <Nav.Link>
              <Link to="/" className="white" >
              Home
              </Link>
            </Nav.Link>
            <Nav.Link>
            <Link to="/problems" className="white" >
              Problems
              </Link>
            </Nav.Link>
            {isLoggedIn ? (
              <Nav.Link>
                <Link className="white"
                to="/logout"
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.removeItem(OJ_TOKEN_KEY);
                  setIsLoggedIn(false);
                }}>
                Logout
                </Link>
              </Nav.Link>
            ) : (
              <Nav.Link>
                <Link className="white" to="/login">
                Login
                </Link>
                
              </Nav.Link>
            )}
          </Nav>
        </Container>
      </Navbar>
      <Routes>
        <Route path="/problems" element={<ProblemsScreen />} />
        <Route
          path="/problems/:problemId"
          element={<PrivateRouteWrapper element={<ProblemScreen />} />}
        />
        <Route path="/login" element={<LoginComponent />} />
        <Route path="/signup" element={<SignupComponent />} />
        <Route
          path="/forgotPassword/:email/:token"
          element={<ForgotPasswordConfirmationComponent />}
        />
        <Route path="/forgotPassword" element={<ForgotPasswordComponent />} />
        <Route
          path="/submission/:id"
          element={<PrivateRouteWrapper element={<SubmissionComponent />} />}
        />
        <Route path="/" element={<WelcomeComponent />} />
      </Routes>
    </Router>
  );
};
const StoreProviderOverride = StoreProvider as any;

const RootApp = () => {
  return (
    <StoreProviderOverride store={store}>
      <App />
    </StoreProviderOverride>
  );
};

export default RootApp;
