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
  currentUser2?: string;
  users: string[];
  changeUser: (username: string) => void;
  changeUser2: (username: string) => void;
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
    <>
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
            label="User 1"
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
      {props.currentUser2 && (
        <Autocomplete
          onChange={(event, value) => {
            props.changeUser2(value);
          }}
          value={props.currentUser2}
          key="input-user2"
          placeholder=""
          renderInput={(params) => (
            <TextField
              {...params} // eslint-disable-line react/jsx-props-no-spreading
              label="User 2"
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
      )}
    </>
  </Popover>
);

UsersPopover.defaultProps = {
  currentUser2: null,
};
