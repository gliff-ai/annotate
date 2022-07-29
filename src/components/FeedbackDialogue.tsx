import {
  ReactElement,
  useCallback,
  useEffect,
  useState,
  ChangeEvent,
} from "react";
import {
  theme,
  black,
  Dialogue,
  Notepad,
  Divider,
  MuiIconbutton,
} from "@gliff-ai/style";
import { StarOutlineRounded, StarRounded } from "@mui/icons-material";
import { SvgIcon } from "@mui/material"; // TODO: export from STYLE

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
}: Props): ReactElement => {
  const [comment, setComment] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [canOpen, setCanOpen] = useState<boolean>(false);

  const updateCanOpen = useCallback(() => {
    if (canRequestFeedback) void canRequestFeedback().then(setCanOpen);
  }, [canRequestFeedback]);

  useEffect(() => {
    updateCanOpen();
  }, [updateCanOpen]);

  return canOpen ? (
    <Dialogue
      close
      title="Feedback Form"
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
      confirmText="Send Feedback"
    >
      <div
        style={{
          display: "block",
          textAlign: "left",
          verticalAlign: "middle",
          width: "500px",
          marginTop: "-10px",
        }}
      >
        <p style={{ fontSize: "16px", marginBottom: "10px" }}>
          We value feedback from our users about their experiences using the
          gliff.ai platform so that we can continue to improve our porduct.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            marginBottom: "10px",
          }}
        >
          <p style={{ fontSize: "16px", marginRight: "5px" }}>Rating:</p>
          {RATINGS.map((ratingText, i) => {
            const isSelected = rating !== null && i <= rating;

            return (
              <MuiIconbutton
                sx={{ padding: "2px" }}
                key={ratingText}
                size="large"
                onClick={() => setRating(i)}
              >
                <SvgIcon
                  sx={{
                    width: "40px",
                    height: "40px",
                    ...(isSelected
                      ? {
                          fill: theme.palette.primary.main,
                          stroke: theme.palette.primary.main,
                        }
                      : { fill: black }),
                  }}
                  component={isSelected ? StarRounded : StarOutlineRounded}
                />
              </MuiIconbutton>
            );
          })}
        </div>
        <Notepad
          value={comment}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setComment(e.target.value)
          }
          rows={5}
          maxCharacters={500}
          placeholder="Please share your feedback and any suggestions here..."
        />
        <Divider
          sx={{
            margin: "15px -15px -45px -15px",
            width: "600px",
            lineHeight: "1px",
          }}
        />
      </div>
    </Dialogue>
  ) : (
    TriggerButton
  );
};
