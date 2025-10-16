import { useState } from "react";

export default function Entries({ entries, markAsSold, removeEntry }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-20 max-w-xl mx-auto">
      {/* Header */}
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-lg font-semibold">Entries</h2>
        <span className="text-gray-500 font-bold">
          {isOpen ? "-" : "+"}
        </span>
      </div>

      {/* Collapsible content */}
      {isOpen && (
        <div className="mt-3 space-y-3">
          {entries.length === 0 ? (
            <p className="text-gray-600">No entries yet.</p>
          ) : (
            entries.map((ent) => (
              <div
                key={ent.id}
                className={`rounded-lg p-3 border ${
                  ent.sold ? "bg-gray-200" : "bg-gray-50"
                }`}
              >
                <div>
                  <p className="font-medium">
                    {ent.gram} g {ent.purity.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Date: {ent.date} | From: {ent.boughtFrom}
                  </p>
                  <p className="text-sm">Paid: ₹ {ent.amountPaid}</p>
                  {ent.sold && (
                    <p className="text-xs text-red-600 font-semibold">SOLD</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  {!ent.sold && (
                    <button
                      onClick={() => markAsSold(ent.id)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-600 transition"
                    >
                      Mark Sold
                    </button>
                  )}
                  <button
                    onClick={() => removeEntry(ent.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
