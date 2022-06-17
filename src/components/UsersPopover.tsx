import { ReactElement, MouseEvent } from "react";
import {
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

let refUsersPopoverButton: HTMLButtonElement;

export const UsersPopover = (props: Props): ReactElement => (
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
          refUsersPopoverButton = ref;
        }}
        onClick={() => {
          props.handleOpen()(refUsersPopoverButton);
        }}
      />
    }
  >
    <Autocomplete
      onChange={(event, value) => {
        props.changeUser(value);
      }}
      value={props.currentUser}
      key="input-user1"
      placeholder=""
      renderInput={(params) => (
        <TextField
          {...params} // eslint-disable-line react/jsx-props-no-spreading
          label="User"
          autoFocus
          sx={{
            fontSize: 14,
            width: "300px",
            marginBottom: "20px",
          }}
        />
      )}
      options={props.users}
    />
  </Popover>
);
