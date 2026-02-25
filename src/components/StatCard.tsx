interface StatCardProps {
  value: string;
  label: string;
}

const StatCard = ({ value, label }: StatCardProps) => {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-heading font-bold text-primary-foreground mb-1">
        {value}
      </div>
      <div className="text-sm text-primary-foreground/70">{label}</div>
    </div>
  );
};

export default StatCard;
