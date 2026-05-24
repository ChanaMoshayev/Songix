import { Container } from "@mui/material";
import ContestBoard from "../components/ContestBoard.jsx";

export default function ContestPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 4, sm: 6 } }}>
      <ContestBoard />
    </Container>
  );
}
