import { useEffect, useMemo, useState } from "react";
import styles from "./SearchVisualizer.module.css";
import { runAlgorithm } from "../../services/algorithmApi";

const parseNumbers = (input) => {
  return input
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value));
};

const SearchVisualizer = ({
  title,
  description,
  algorithmKey,
  defaultNumbers = "5, 1, 4, 2, 8",
}) => {
  const [numbersInput, setNumbersInput] = useState(defaultNumbers);
  const [targetInput, setTargetInput] = useState("");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [algorithmResponse, setAlgorithmResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);
  const [foundIndex, setFoundIndex] = useState(null);
  const [visitedIndexes, setVisitedIndexes] = useState([]);

  const parsedNumbers = useMemo(
    () => parseNumbers(numbersInput),
    [numbersInput],
  );
  const parsedTarget = useMemo(() => {
    const target = Number(targetInput.trim());
    return Number.isNaN(target) ? null : target;
  }, [targetInput]);

  const steps = algorithmResponse?.reportList ?? [];
  const activeStep = steps[activeStepIndex] ?? null;
  const bars = activeStep?.currentState ?? parsedNumbers;
  const highlightedIndexes = activeStep?.activeIndex ?? [];

  // Calculate search pointers for binary search
  const searchPointers = useMemo(() => {
  if (!activeStep || algorithmKey !== "binary-search") {
    return {};
  }

  let left = 0;
  let right = bars.length - 1;

  for (let i = 0; i <= activeStepIndex; i++) {
    const step = steps[i];

    const currentMid =
      step.activeIndex?.[0] ??
      Math.floor((left + right) / 2);

    if (step.type === "SEARCH_RIGHT") {
      left = currentMid + 1;
    }

    if (step.type === "SEARCH_LEFT") {
      right = currentMid - 1;
    }

    if (step.type === "FOUND") {
      left = currentMid;
      right = currentMid;
    }
  }

  const mid = Math.floor((left + right) / 2);

  return { left, right, mid };
}, [activeStep, algorithmKey, bars.length, activeStepIndex, steps]);


  const inactiveIndexes = useMemo(() => {
  if (algorithmKey !== "binary-search") return [];

  const inactive = [];

  for (let i = 0; i < bars.length; i++) {

    if (
      i < searchPointers.left ||
      i > searchPointers.right
    ) {
      inactive.push(i);
    }
  }

  return inactive;
}, [algorithmKey, bars.length, searchPointers]);

  useEffect(() => {
    if (!steps.length) {
      setActiveStepIndex(0);
      return;
    }
    setActiveStepIndex((currentIndex) =>
      Math.min(currentIndex, steps.length - 1),
    );
  }, [steps]);

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return undefined;

    const timer = window.setInterval(() => {
      setActiveStepIndex((currentIndex) => {
        if (currentIndex >= steps.length - 1) {
          setIsPlaying(false);
          return currentIndex;
        }
        return currentIndex + 1;
      });
    }, speed);

    return () => window.clearInterval(timer);
  }, [isPlaying, speed, steps.length]);

  useEffect(() => {
    if (activeStep?.type === "FOUND" && highlightedIndexes.length > 0) {
      setFoundIndex(highlightedIndexes[0]);
    }
  }, [activeStep, highlightedIndexes]);

  useEffect(() => {
    if (highlightedIndexes.length > 0) {
      setVisitedIndexes((prev) => {
        const updated = [...new Set([...prev, ...highlightedIndexes])];
        return updated;
      });
    }
  }, [highlightedIndexes]);

  

  const handleInputChange = (event) => {
    setNumbersInput(event.target.value);
    setAlgorithmResponse(null);
    setError("");
    setActiveStepIndex(0);
    setIsPlaying(false);
  };

  const handleTargetChange = (event) => {
    setTargetInput(event.target.value);
    setAlgorithmResponse(null);
    setError("");
    setActiveStepIndex(0);
    setIsPlaying(false);
  };

  const handleRunAlgorithm = async () => {
    if (parsedNumbers.length < 1) {
      setError("Enter at least one valid number.");
      setAlgorithmResponse(null);
      return;
    }

    if (parsedTarget === null) {
      setError("Enter a valid target integer.");
      setAlgorithmResponse(null);
      return;
    }

    try {
      setLoading(true);
      setFoundIndex(null);
      setVisitedIndexes([]);
      setError("");
      const response = await runAlgorithm(
        algorithmKey,
        parsedNumbers,
        parsedTarget,
      );
      setAlgorithmResponse(response);
      setActiveStepIndex(0);
      setIsPlaying(false);
    } catch (requestError) {
      setAlgorithmResponse(null);
      setError(requestError.message || "Could not reach the backend.");
      setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!steps.length) return;
    if (activeStepIndex === steps.length - 1) setActiveStepIndex(0);
    setIsPlaying((currentValue) => !currentValue);
  };

  const getBarClass = (index) => {
    let baseClass = styles.bar;
    if (highlightedIndexes.includes(index)) {
      baseClass += ` ${styles.barActive}`;
    }

    // Add search-specific styling
    if (algorithmKey === "binary-search") {
      if (index === searchPointers.left) {
        baseClass += " left-pointer";
      }
      if (index === searchPointers.right) {
        baseClass += " right-pointer";
      }
      if (index === searchPointers.mid && highlightedIndexes.includes(index)) {
        baseClass += " mid-pointer";
      }
    }

    return baseClass;
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Searching Visualizer</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{description}</p>
        </div>
        <div className={styles.endpointBox}>
          <span className={styles.endpointLabel}>Backend Endpoint</span>
          <code className={styles.endpoint}>
            POST /api/visualize/{algorithmKey}
          </code>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Input</h2>
            <label className={styles.label} htmlFor={`${algorithmKey}-numbers`}>
              Numbers
            </label>
            <textarea
              id={`${algorithmKey}-numbers`}
              className={styles.textarea}
              value={numbersInput}
              onChange={handleInputChange}
              placeholder="Example: 5, 1, 4, 2, 8"
            />
            <label className={styles.label} htmlFor={`${algorithmKey}-target`}>
              Target Value
            </label>
            <input
              id={`${algorithmKey}-target`}
              className={styles.input}
              value={targetInput}
              onChange={handleTargetChange}
              placeholder="Example: 7"
            />

            {/* Target Display */}
            {parsedTarget !== null && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.8rem",
                  backgroundColor: "rgba(0, 188, 212, 0.1)",
                  border: "1px solid #00bcd4",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "#7ad8e6",
                    marginBottom: "0.3rem",
                  }}
                >
                  Searching for:
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "#00bcd4",
                  }}
                >
                  {parsedTarget}
                </div>
              </div>
            )}

            <p className={styles.helperText}>
              Enter numbers and a target value. The algorithm will search for
              the target in the array.
            </p>

            {error && <p className={styles.errorText}>{error}</p>}
            {loading && (
              <p className={styles.infoText}>
                Running {algorithmKey} on the backend...
              </p>
            )}

            <div className={styles.buttonRow}>
              <button
                className={styles.primaryButton}
                onClick={handleRunAlgorithm}
                disabled={loading}
              >
                {loading ? "Running..." : "Run Algorithm"}
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  setActiveStepIndex(0);
                  setAlgorithmResponse(null);
                  setError("");
                  setIsPlaying(false);
                  setFoundIndex(null);
                  setVisitedIndexes([]);
                }}
              >
                Reset View
              </button>
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Summary</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Comparisons</span>
                <strong>{algorithmResponse?.totalComparision ?? 0}</strong>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Complexity</span>
                <strong>
                  {algorithmResponse?.theoriticalComplexity ?? "-"}
                </strong>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Array Size</span>
                <strong>
                  {algorithmResponse?.theoriticalSteps ?? bars.length}
                </strong>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Status</span>
                <strong>
  {foundIndex !== null
    ? "Found"
    : activeStep?.type === "FINISH"
    ? "Not Found"
    : "Searching"}
</strong>
              </div>
            </div>
          </div>

          {/* Binary Search Pointers Display */}
          {algorithmKey === "binary-search" &&
            Object.keys(searchPointers).length > 0 && (
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>Search Pointers</h2>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    gap: "1rem",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "#8ba1b9" }}>
                      Left
                    </div>
                    <div
                      style={{
                        fontSize: "1.2rem",
                        color: "#4CAF50",
                        fontWeight: "bold",
                      }}
                    >
                      {searchPointers.left}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "#8ba1b9" }}>
                      Mid
                    </div>
                    <div
                      style={{
                        fontSize: "1.2rem",
                        color: "#FF9800",
                        fontWeight: "bold",
                      }}
                    >
                      {searchPointers.mid}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "#8ba1b9" }}>
                      Right
                    </div>
                    <div
                      style={{
                        fontSize: "1.2rem",
                        color: "#f44336",
                        fontWeight: "bold",
                      }}
                    >
                      {searchPointers.right}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </aside>

        <div className={styles.main}>
          <div className={styles.panel}>
            <div className={styles.viewerHeader}>
              <div>
                <h2 className={styles.panelTitle}>Current Frame</h2>
                <p className={styles.frameDescription}>
                  {activeStep?.desp ??
                    "Type numbers and target, then run the algorithm to load the backend frames here."}
                </p>
              </div>
              <span className={styles.stepBadge}>
                {activeStep
                  ? `${activeStep.type} | Step ${activeStepIndex + 1}/${steps.length}`
                  : "No Step Loaded"}
              </span>
            </div>

            <div className={styles.controlsRow}>
              <button
                className={styles.primaryButton}
                onClick={handlePlayPause}
                disabled={!steps.length}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <div className={styles.speedControl}>
                <label
                  className={styles.speedLabel}
                  htmlFor={`${algorithmKey}-speed`}
                >
                  Speed
                </label>
                <select
                  id={`${algorithmKey}-speed`}
                  className={styles.speedSelect}
                  value={speed}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                >
                  <option value={1000}>Slow</option>
                  <option value={700}>Normal</option>
                  <option value={400}>Fast</option>
                  <option value={220}>Very Fast</option>
                </select>
              </div>
            </div>

            <div className={styles.barArea}>
              {bars.length ? (
                bars.map((value, index) => {
                  const maxValue = Math.max(...bars, 1);
                  const barHeight = `${Math.max((value / maxValue) * 100, 12)}%`;
                  const isActive = highlightedIndexes.includes(index);
                  const isTarget =
                    parsedTarget !== null && value === parsedTarget;

                  return (
                    <div key={`${value}-${index}`} className={styles.barColumn}>
                      <span
                        className={styles.barValue}
                        style={{
                          color: isTarget ? "#00bcd4" : "#b9c6d6",
                          fontWeight: isTarget ? "bold" : "normal",
                        }}
                      >
                        {value}
                        {isTarget && (
                          <span
                            style={{ fontSize: "0.7rem", marginLeft: "2px" }}
                          >
                            🎯
                          </span>
                        )}
                      </span>
                      <div
                        className={getBarClass(index)}
                        style={{
                          height: barHeight,

                          opacity:
  inactiveIndexes.includes(index) &&
  index !== foundIndex
    ? 0.18
    : visitedIndexes.includes(index) &&
      !highlightedIndexes.includes(index) &&
      index !== foundIndex
    ? 0.45
    : 1,

                          filter:
  inactiveIndexes.includes(index) &&
  index !== foundIndex
    ? "grayscale(90%) blur(1px)"
    : visitedIndexes.includes(index) &&
      !highlightedIndexes.includes(index) &&
      index !== foundIndex
    ? "grayscale(60%)"
    : "none",

                          transform: highlightedIndexes.includes(index)
                            ? "scaleY(1.05)"
                            : "scaleY(1)",

                          transition: "all 0.35s ease",

                          background:
                            // FOUND BAR
                            index === foundIndex
                              ? "linear-gradient(180deg, #4CAF50 0%, #2E7D32 100%)"
                              : // CURRENT MID / ACTIVE
                                highlightedIndexes.includes(index)
                                ? "linear-gradient(180deg, #FF9800 0%, #F57C00 100%)"
                                : // LEFT POINTER
                                  algorithmKey === "binary-search" &&
  index === searchPointers.left &&
  !inactiveIndexes.includes(index)
                                  ? "linear-gradient(180deg, #42A5F5 0%, #1E88E5 100%)"
                                  : algorithmKey === "binary-search" &&
  index === searchPointers.right &&
  !inactiveIndexes.includes(index)
                                    ? "linear-gradient(180deg, #AB47BC 0%, #8E24AA 100%)"
                                    : // TARGET (only for linear search mainly)
                                      algorithmKey !== "binary-search" &&
                                        isTarget
                                      ? "linear-gradient(180deg, #00BCD4 0%, #0097A7 100%)"
                                      : // DEFAULT
                                        undefined,
                        }}
                      />
                      <span className={styles.barIndex}>{index}</span>

                      {/* Pointer Labels for Binary Search */}
                      {algorithmKey === "binary-search" && (
                        <div
                          style={{
                            position: "absolute",
                            top: "-20px",
                            fontSize: "0.7rem",
                            fontWeight: "bold",
                          }}
                        >
                          {index === searchPointers.left && (
                            <span style={{ color: "#4CAF50" }}>L</span>
                          )}
                          {index === searchPointers.mid &&
                            highlightedIndexes.includes(index) && (
                              <span style={{ color: "#FF9800" }}>M</span>
                            )}
                          {index === searchPointers.right && (
                            <span style={{ color: "#f44336" }}>R</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className={styles.emptyState}>
                  Add some numbers to preview the search layout.
                </p>
              )}
            </div>

            <div className={styles.navigationRow}>
              <button
                className={styles.secondaryButton}
                onClick={() =>
                  setActiveStepIndex((currentIndex) =>
                    Math.max(currentIndex - 1, 0),
                  )
                }
                disabled={!steps.length || activeStepIndex === 0 || isPlaying}
              >
                Previous
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() =>
                  setActiveStepIndex((currentIndex) =>
                    Math.min(currentIndex + 1, steps.length - 1),
                  )
                }
                disabled={
                  !steps.length ||
                  activeStepIndex === steps.length - 1 ||
                  isPlaying
                }
              >
                Next
              </button>
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Algorithm Steps</h2>
            {steps.length ? (
              <div className={styles.stepList}>
                {steps.map((step, index) => {
                  const isSelected = index === activeStepIndex;
                  return (
                    <button
                      key={`${step.type}-${index}`}
                      className={`${styles.stepItem} ${isSelected ? styles.stepItemSelected : ""} ${isSelected && isPlaying ? styles.stepItemPlaying : ""}`}
                      disabled={isPlaying}
                      onClick={() => setActiveStepIndex(index)}
                    >
                      <span className={styles.stepTopRow}>
                        <span className={styles.stepType}>{step.type}</span>
                        {isSelected && (
                          <span className={styles.liveBadge}>
                            {isPlaying ? "Live" : "Current"}
                          </span>
                        )}
                      </span>
                      <span className={styles.stepText}>{step.desp}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyState}>
                No response loaded yet. Click `Run Algorithm` to fetch the step
                frames.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchVisualizer;
