import SearchVisualizer from "../../components/searchvisualizer/SearchVisualizer";

const LinearSearch = () => {
  return (
    <SearchVisualizer
      title="Linear Search Visualizer"
      description="Scan each element until the target is found or the array ends. Enter a target value to see search progress."
      algorithmKey="linear-search"
      defaultNumbers="4, 9, 2, 7, 5"
    />
  );
};

export default LinearSearch;
