import { clsxtw, getInitials } from '../utils/utils';

export const Avatar = ({ name }: { name: string }) => (
  <div
    className="avatar placeholder tooltip tooltip-top"
    aria-label={name}
    data-tip={name}
  >
    <div className="w-12 h-12 rounded-full bg-neutral-focus text-neutral-content">
      <span className="text-2xl">{getInitials(name)}</span>
    </div>
  </div>
);

export const AvatarGroup = ({
  className,
  names,
  max,
}: {
  className?: string;
  names: string[];
  max: number;
}) => {
  const visible = names.slice(0, max);
  const hidden = names.length - visible.length;

  return (
    <div className={clsxtw('avatar-group', className)}>
      {visible.map((name) => (
        <Avatar key={name} name={name} />
      ))}
      {hidden !== 0 && (
        <div className="avatar placeholder tooltip tooltip-top">
          <div className="w-12 rounded-full bg-neutral-focus  text-neutral-content">
            <span className="text-xl">+{hidden}</span>
          </div>
        </div>
      )}
    </div>
  );
};
