import React from "react";

const tags = [
  "All",
  "LostItem",
  "UrgentHelp",
  "Found",
  "Guidance",
  "Donation",
  "Medical",
  "Financial",
  "Other",
];

const TagsBar = () => {
  return (
    <div className="overflow-x-auto w-full py-3 px-4 bg-white shadow-sm border-b">
      <div className="flex space-x-3 w-max">
        {tags.map((tag, idx) => (
          <button
            key={idx}
            className="bg-gray-100 hover:bg-blue-100 text-gray-700 text-sm px-3 py-1 rounded-full whitespace-nowrap"
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagsBar;
