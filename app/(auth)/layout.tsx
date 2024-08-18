import Image from 'next/image';

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<main className='flex min-h-screen w-full justify-between font-inter'>
			{children}
			<div className='auth-asset'>
				<div className='flex flex-col justify-center'>
					<Image
						src='/icons/signin.png'
						alt='Auth image'
						width={800}
						height={800}
					/>
					<div className='text-36 text-center'>Bank Smarter, Live Better.</div>
				</div>
			</div>
		</main>
	);
}
