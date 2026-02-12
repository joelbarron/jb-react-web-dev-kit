import Button, { ButtonProps } from "@mui/material/Button";

type AuthSecondaryButtonProps = Omit<ButtonProps, "variant"> & {
  to?: string;
};

export function AuthSecondaryButton(props: AuthSecondaryButtonProps) {
  const { sx, ...rest } = props;

  return (
    <Button
      {...(rest as ButtonProps)}
      variant="outlined"
      sx={{
        width: "100%",
        minHeight: 38,
        borderWidth: 1,
        borderColor: "rgba(15, 23, 42, 0.28)",
        color: "text.primary",
        fontWeight: 600,
        "&:hover": {
          borderWidth: 1,
          borderColor: "rgba(15, 23, 42, 0.45)",
        },
        ...(sx ?? {}),
      }}
    />
  );
}
