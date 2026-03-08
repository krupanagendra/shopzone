const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' }[size];
  return (
    <div className="flex justify-center items-center py-8">
      <div className={`${s} border-4 border-gray-200 border-t-amazon-yellow rounded-full animate-spin`}></div>
    </div>
  );
};
export default Spinner;