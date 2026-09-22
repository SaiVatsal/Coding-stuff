import { useState } from "react";
import "./App.css";

import Sub from "./Components/Sub.jsx";
import Student from "./Components/Student.jsx";

function App() {

  const Name = "Sai";

  // Arrow Function Component - Sum
  const Sum = () => {
    return (
      <>
        <div>Sum</div>

        <div>
          <h1>Arrow Function Component Sum
            Sum 100 + 100 = 200
          </h1>
        </div>

        <div>
          Sum is: {100 + 200}
        </div>
      </>
    );
  };

  // useState
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <h1>This is the React function component App example</h1>
      </div>

      <div>
        <h1>Myself</h1>
        <h1>{Name}</h1>
      </div>

      <hr />

      {/* Sum Component */}
      <Sum />

      <hr />

      {/* Sub Component */}
      <Sub />

      <hr />

      {/* useState Example */}
      <h2>useState Example</h2>

      <h3>Count: {count}</h3>

      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>

      <button onClick={() => setCount(count - 1)}>
        Decrement
      </button>

      <button onClick={() => setCount(0)}>
        Reset
      </button>

      <hr />

      {/* Props Example */}
      <Student
        name="Sai"
        course="Full Stack Web Development"
      />

      <hr />

      {/* Image */}
      <img
        src="/reactjs-facts.jpg"
        alt="React JS Facts"
        width="300"
      />
    </>
  );
}

export default App;