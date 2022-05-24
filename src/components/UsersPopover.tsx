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
  users: string[];
  changeUser: (username: string) => void;
  handleOpen: (
    event?: MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
}

let refBackgroundSettingsPopover: HTMLButtonElement;

export const UsersPopover = (props: Props): ReactElement => {
  const [username, setUsername] = useState<string>(props.users[0]);

  if (username === undefined && props.users.length > 0)
    setUsername(props.users[0]);

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
          setUsername(value);
          props.changeUser(value);
        }}
        value={username}
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
              width: "300px",
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
