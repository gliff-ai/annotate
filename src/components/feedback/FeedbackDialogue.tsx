import { ReactElement, useState } from "react";
import { Notepad, Dialogue } from "@gliff-ai/style";
import { Star } from "./Star";

const RATINGS = ["Poor", "Fair", "Good", "Very good", "Excellent"];
interface Props {
  TriggerButton: ReactElement;
  setIsTyping: (value: boolean) => void;
  saveUserFeedback: (data: {
    rating: number;
    comment: string;
  }) => Promise<number> | null;
}
export const FeedbackDialogue = ({
  TriggerButton,
  setIsTyping,
  saveUserFeedback,
}: Props) => {
  const [comment, setComment] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);

  return (
    <Dialogue
      close
      title="Feedback"
      TriggerButton={TriggerButton}
      onConfirm={async () => {
        if (saveUserFeedback) {
          const result = await saveUserFeedback({ rating, comment });
        }
      }}
      afterClose={() => {
        setIsTyping(false);
      }}
    >
      <div
        style={{
          display: "block",
          textAlign: "center",
          verticalAlign: "middle",
        }}
      >
        <p style={{ fontSize: "16px", marginBottom: "35px" }}>
          We&apos;d love your feedback!
        </p>
        <div style={{ width: "100%", marginBottom: "15px" }}>
          {RATINGS.map((ratingText, i) => (
            <Star
              key={ratingText}
              rating={i}
              setRating={setRating}
              isSelected={rating !== null && i <= rating}
            />
          ))}
        </div>
        <Notepad
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          maxCharacters={500}
          placeholder="Any comments? Suggestions?"
        />
      </div>
    </Dialogue>
  );
};
