import styles from "./VisualizerCard.module.css";
import { useNavigate } from "react-router-dom";

const VisualizerCards = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Bubble Sort</h2>
        <p>Watch adjacent elements compare and swap until the array is sorted.</p>
        <button onClick={() => navigate("/sorting/bubble-sort")}>
          Open
        </button>
      </div>

      <div className={styles.card}>
        <h2>Insertion Sort</h2>
        <p>See each value move into its correct position in the growing sorted section.</p>
        <button onClick={() => navigate("/sorting/insertion-sort")}>Open</button>
      </div>

      <div className={styles.card}>
        <h2>Linear Search</h2>
        <p>Visualize linear search scanning through the array to find a target.</p>
        <button onClick={() => navigate("/searching/linear-search")}>Open</button>
      </div>

      <div className={styles.card}>
        <h2>Binary Search</h2>
        <p>Visualize binary search efficiently finding targets in sorted arrays.</p>
        <button onClick={() => navigate("/searching/binary-search")}>Open</button>
      </div>
    </div>
  );
};

export default VisualizerCards;
