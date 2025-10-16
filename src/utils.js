export function formatIndianCurrency(num) {
  if (typeof num !== "number") return num;
 const amount =  num.toFixed(2)
  const [integerPart, decimalPart] = amount.toString().split(".");

  // Regular expression for Indian amountber format
  const formattedInt = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))(?=(?:\d{3})*(?:\d{2})?$)/g,
    ","
  );

  return decimalPart ? `${formattedInt}.${decimalPart}` : formattedInt;
}


