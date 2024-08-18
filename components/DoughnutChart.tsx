'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ accounts }: DoughnutChartProps) => {
	const accountNames = accounts.map((a) => a.name);
	const balances = accounts.map((a) => a.currentBalance);

	const [isLoading, setIsLoading] = useState(true);

	const data = {
		datasets: [
			{
				label: 'Banks',
				data: balances,
				backgroundColor: ['#0747b6', '#2265d8', '#2f91fa'],
			},
		],
		labels: accountNames,
	};

	const checkData = () => {
		setIsLoading(true);
		if (data) {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		checkData();
	}, [data]);

	return (
		<>
			{isLoading ? (
				<div className='flex w-full justify-center items-center'>
					<Loader2
						size={140}
						className='animate-spin '
					/>
				</div>
			) : (
				<Doughnut
					data={data}
					options={{
						cutout: '60%',
						plugins: {
							legend: {
								display: false,
							},
						},
					}}
				/>
			)}
		</>
	);
};

export default DoughnutChart;
