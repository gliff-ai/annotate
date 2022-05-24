import { ReactElement, useState, MouseEvent } from "react";
import {
  Card,
  Popover,
  IconButton,
  icons,
  Autocomplete,
  TextField,
} from "@gliff-ai/style";

interface Props {
  currentUser: string;
  users: string[];
  changeUser: (username: string) => void;
  handleOpen: (
    event?: MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
}

let refBackgroundSettingsPopover: HTMLButtonElement;

export const UsersPopover = (props: Props): ReactElement => {
  const [username, setUsername] = useState<string>(props.currentUser);

  return (
    <Popover
      title="Select A User"
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      TriggerButton={
        <IconButton
          tooltip={{ name: "Select A User" }}
          icon={icons.usersPage}
          size="small"
          setRefCallback={(ref) => {
            refBackgroundSettingsPopover = ref;
          }}
          onClick={() => {
            props.handleOpen()(refBackgroundSettingsPopover);
          }}
        />
      }
    >
      <Autocomplete
        onChange={(event, value) => {
          console.log("onChange");
          setUsername(value);
        }}
        onInputChange={(event, value) => {
          setUsername(value);
        }}
        key="input-user1"
        placeholder=""
        renderInput={(params) => (
          <TextField
            {...params}
            label="Username"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                props.changeUser(username);
              }
            }}
            autoFocus
            sx={{
              fontSize: 14,
              width: "225px",
              marginBottom: "20px",
              borderBottom: "solid 1px #dadde9",
            }}
          />
        )}
        options={props.users}
      />
    </Popover>
  );
};
