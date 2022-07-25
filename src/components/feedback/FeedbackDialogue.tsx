import {
  ReactElement,
  useCallback,
  useEffect,
  useState,
  ChangeEvent,
} from "react";
import { Dialogue, Notepad } from "@gliff-ai/style";
import { Star } from "./Star";

const RATINGS = ["Poor", "Fair", "Good", "Very good", "Excellent"];
interface Props {
  TriggerButton: ReactElement;
  setIsTyping: (value: boolean) => void;
  saveUserFeedback:
    | ((data: { rating: number | null; comment: string }) => Promise<number>)
    | null;
  canRequestFeedback: (() => Promise<boolean>) | null;
}
export const FeedbackDialogue = ({
  TriggerButton,
  setIsTyping,
  saveUserFeedback,
  canRequestFeedback,
}: Props) => {
  const [comment, setComment] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [canOpen, setCanOpen] = useState<boolean>(false);

  const updateCanOpen = useCallback(() => {
    if (canRequestFeedback) void canRequestFeedback().then(setCanOpen);
  }, [canRequestFeedback]);

  useEffect(() => {
    updateCanOpen();
  }, []);

  return canOpen ? (
    <Dialogue
      close
      title="Feedback"
      TriggerButton={TriggerButton}
      afterOpen={() => {
        setIsTyping(true); // to deactivate shortcuts
      }}
      afterClose={() => {
        setIsTyping(false); // to re-activate shortcuts
        setRating(null);
        setComment("");
        updateCanOpen();
      }}
      onConfirm={() => {
        if (saveUserFeedback) {
          void saveUserFeedback({ rating, comment });
        }
      }}
      onCancel={() => {
        if (saveUserFeedback) {
          void saveUserFeedback({ rating: null, comment });
        }
      }}
      confirmEnabled={rating !== null}
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
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setComment(e.target.value)
          }
          rows={5}
          maxCharacters={500}
          placeholder="Any comments? Suggestions?"
        />
      </div>
    </Dialogue>
  ) : (
    TriggerButton
  );
};
