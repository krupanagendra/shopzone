import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
const Rating = ({ value, text, color = "text-amazon-yellow" }) => {
  const stars = [1, 2, 3, 4, 5].map((i) =>
    value >= i ? "full" : value >= i - 0.5 ? "half" : "empty"
  );
  return (
    <div className="flex items-center gap-1">
      {stars.map((type, i) => (
        <span key={i} className={color}>
          {type === "full" ? <FaStar /> : type === "half" ? <FaStarHalfAlt /> : <FaRegStar />}
        </span>
      ))}
      {text && <span className="text-gray-500 text-sm ml-1">{text}</span>}
    </div>
  );
};
export default Rating;