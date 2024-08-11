'use client';
import React from 'react';
import CountUp from 'react-countup';
import { formatAmount } from '@/lib/utils';

const AnimatedCounter = ({ amount }: { amount: number }) => {
	return (
		<div className='w-full'>
			<CountUp
				duration={2.75}
				end={amount}
				decimal='2'
				separator=','
				formattingFn={formatAmount}
			/>
		</div>
	);
};

export default AnimatedCounter;
