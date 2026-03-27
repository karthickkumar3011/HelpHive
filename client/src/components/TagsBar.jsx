import React from "react";
import { FEED_TAGS } from "../constants/tags";

const TagsBar = ({ selectedTag = "All", onSelectTag = () => {} }) => {
  return (
    <div className="overflow-x-auto w-full py-3 px-4 bg-white shadow-sm border-b rounded-lg border border-gray-100">
      <div className="flex space-x-3 w-max">
        {FEED_TAGS.map((tag, idx) => {
          const active = String(tag) === String(selectedTag);
          return (
          <button
            key={idx}
            onClick={() => onSelectTag(tag)}
            className={`text-sm px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
              active
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 hover:bg-blue-100 text-gray-700"
            }`}
          >
            #{tag}
          </button>
          );
        })}
      </div>
    </div>
  );
};

export default TagsBar;
