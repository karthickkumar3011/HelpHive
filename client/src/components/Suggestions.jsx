import React from "react";

const suggestedUsers = [
  {
    name: "Aarav Singh",
    tag: "Volunteer • Coimbatore",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    name: "Meera Patel",
    tag: "Helper • Chennai",
    avatar: "https://i.pravatar.cc/150?img=8",
  },
  {
    name: "Ravi Kumar",
    tag: "Student • Bangalore",
    avatar: "https://i.pravatar.cc/150?img=11",
  },
];

const Suggestions = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4 w-full">
      <h3 className="text-lg font-semibold mb-3">Suggestions for you</h3>
      <div className="space-y-3">
        {suggestedUsers.map((user, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.tag}</p>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:underline">
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suggestions;
