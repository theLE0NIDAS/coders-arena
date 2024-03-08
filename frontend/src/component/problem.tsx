import { Row, Col } from "react-bootstrap";
import ProblemProps from "../model/problem_props";
import { Link } from "react-router-dom";

const Problem = (props: ProblemProps) => {
  return (
    <tr key={props.id}>
      <td>
        <p>{props.id}</p>
      </td>
      <td>
        <p>
          <Link to={`/problems/${props.id}`}>{props.title}</Link>
        </p>
      </td>
      <td>
        <p className={props.level}>{props.level}</p>
      </td>
    </tr>
  );
};

export default Problem;
