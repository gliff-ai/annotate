// source: //dev.to/yosraskhiri/rating-stars-in-react-js-4dfg
import { MouseEvent } from "react";

interface Props {
  rating: number;
  setRating: (rating: number) => void;
  isSelected: boolean;
}

export const Star = ({ rating, setRating, isSelected }: Props) => (
  <label
    htmlFor={`star-${rating}`}
    style={{ position: "relative", cursor: "pointer", marginRight: "15px" }}
  >
    <input
      id={`star-${rating}`}
      style={{ display: "none" }}
      type="radio"
      name="rating"
      value={rating}
      onClick={(e: MouseEvent<HTMLInputElement>) => {
        setRating(Number((e.target as HTMLInputElement).value));
      }}
    />

    <svg
      style={isSelected ? { fill: "yellow" } : {}}
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#393939"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  </label>
);

export default Star;
