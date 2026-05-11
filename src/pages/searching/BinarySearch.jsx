import SearchVisualizer from "../../components/searchvisualizer/SearchVisualizer";

const BinarySearch = () => {
  return (
    <SearchVisualizer
      title="Binary Search Visualizer"
      description="Efficiently search in a sorted array by repeatedly dividing the search interval in half. The array is automatically sorted first."
      algorithmKey="binary-search"
      defaultNumbers="4, 9, 2, 7, 5"
    />
  );
};

export default BinarySearch;