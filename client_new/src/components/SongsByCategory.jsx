import { useState } from "react";
import { Select, MenuItem, FormControl, InputLabel, Box } from "@mui/material";
import SongList from "./SongList";
import { collectCategoryIdsFromSongs, songHasCategory } from "../utils/songCategories.js";

export default function SongsByCategory({ songs }) {
  const [selectedCategory, setSelectedCategory] = useState("");

  const filteredSongs =
    selectedCategory === "" ? songs : songs.filter(s => songHasCategory(s, selectedCategory));

  const categories = collectCategoryIdsFromSongs(songs);

  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>קטגוריה</InputLabel>
        <Select
          value={selectedCategory}
          label="קטגוריה"
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <MenuItem value="">כל הקטגוריות</MenuItem>
          {categories.map(cat => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <SongList songs={filteredSongs} />
    </Box>
  );
}