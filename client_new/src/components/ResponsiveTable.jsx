import { Table, TableContainer } from "@mui/material";

/** טבלה עם גלילה אופקית במסכים צרים */
export default function ResponsiveTable({ children, tableProps = {} }) {
  return (
    <TableContainer
      sx={{
        width: "100%",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        mx: { xs: -0.5, sm: 0 },
      }}
    >
      <Table sx={{ minWidth: 520 }} {...tableProps}>
        {children}
      </Table>
    </TableContainer>
  );
}
