import Image from 'next/image'

type PropsType = {
  className?: string,
}

export const CoPlayLogo: React.FC<PropsType> = ({ className }) => {
  return (
    <Image
      src='/logo.png'
      alt='CoPlay Logo'
      width={256}
      height={256}
      className={className}
    />
  );
}
