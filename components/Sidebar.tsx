'use client';
import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import Footer from './Footer';
import PlaidLink from './PlaidLink';
import MobileNav from './MobileNav';

const Sidebar = ({ user, mobileNav }: SidebarProps) => {
	const pathname = usePathname();
	mobileNav = false;
	return (
		<section className='sidebar'>
			<nav className='flex flex-col gap-4'>
				<Link
					href='/'
					className='flex mb-12 cursor-pointer items-center gap-2'
				>
					<Image
						src='/icons/qlogo.svg'
						width={34}
						height={34}
						alt='Quentis logo'
						className='size-[24px] max-xl:size-14'
					/>
					<h1 className='sidebar-logo'>Quentis</h1>
				</Link>
				{sidebarLinks.map((item) => {
					const isActive =
						pathname === item.route || pathname.startsWith('${item.route}/');
					return (
						<Link
							key={item.label}
							href={item.route}
							className={cn('sidebar-link', { 'bg-bank-gradient': isActive })}
						>
							<div className='relative size-6'>
								<Image
									src={item.imgURL}
									alt={item.label}
									fill
									className={cn({ 'brightness-[3] invert-[0]': isActive })}
								/>
							</div>
							<p className={cn('sidebar-label', { '!text-white': isActive })}>
								{item.label}
							</p>
						</Link>
					);
				})}
				<PlaidLink
					user={user}
					mobileNav={mobileNav}
				/>
			</nav>
			<Footer user={user} />
		</section>
	);
};

export default Sidebar;
