import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	ArcElement
);

interface DataVisualizationProps {
	data: any[];
}

export default function DataVisualization({ data }: DataVisualizationProps) {
	// Basic validation
	if (!data?.length || !Array.isArray(data))
		return (
			<div className='text-red-500 p-4 bg-red-50 rounded'>
				Sorry no relevant data found for visualization
			</div>
		);

	try {
		const fields = Object.keys(data[0] || {});
		if (!fields.length) return null;

		// Improved type detection and cleaning
		const fieldTypes = fields.reduce((acc, field) => {
			const values = data.map((item) => item[field]).filter((v) => v != null);
			const isNumeric = values.every(
				(v) => !isNaN(Number(String(v).replace(/[,$]/g, '')))
			);
			const isDate = values.every((v) => !isNaN(Date.parse(String(v))));

			acc[field] = {
				isNumeric,
				isDate,
				isCategory: !isNumeric && !isDate,
			};
			return acc;
		}, {} as Record<string, { isNumeric: boolean; isDate: boolean; isCategory: boolean }>);

		const numericFields = fields.filter((field) => fieldTypes[field].isNumeric);
		const dateFields = fields.filter((field) => fieldTypes[field].isDate);
		const categoryFields = fields.filter(
			(field) => fieldTypes[field].isCategory
		);

		// Fall back to first field if no proper category field found
		const categoryField = categoryFields[0] || dateFields[0] || fields[0];

		// Clean and prepare labels
		const labels = data.map((item) => {
			const value = item[categoryField];
			if (!value) return 'N/A';
			if (fieldTypes[categoryField].isDate) {
				return new Date(value).toLocaleDateString();
			}
			return String(value);
		});

		// Prepare datasets with error handling
		const chartData = {
			labels,
			datasets: numericFields.map((field, index) => ({
				label: field
					.replace(/_/g, ' ')
					.replace(/\b\w/g, (l) => l.toUpperCase()),
				data: data.map((item) => {
					const value = item[field];
					if (value == null) return 0;
					return Number(String(value).replace(/[,$]/g, '')) || 0;
				}),
				backgroundColor: [
					'rgba(59, 130, 246, 0.5)', // Blue
					'rgba(16, 185, 129, 0.5)', // Green
					'rgba(245, 158, 11, 0.5)', // Amber
					'rgba(139, 92, 246, 0.5)', // Purple
					'rgba(236, 72, 153, 0.5)', // Pink
				][index % 5],
				borderColor: [
					'rgba(59, 130, 246, 1)',
					'rgba(16, 185, 129, 1)',
					'rgba(245, 158, 11, 1)',
					'rgba(139, 92, 246, 1)',
					'rgba(236, 72, 153, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)',
					'rgba(153, 102, 255, 1)',
				][index % 5],
				borderWidth: 1,
			})),
		};

		const options = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'top' as const,
				},
				title: {
					display: true,
					text: `${categoryField
						.replace(/_/g, ' ')
						.replace(/\b\w/g, (l) => l.toUpperCase())} Analysis`,
				},
			},
			scales: {
				y: {
					beginAtZero: true,
				},
			},
		};

		// Enhanced chart type selection
		const shouldUsePie =
			data.length <= 10 &&
			numericFields.length === 1 &&
			!fieldTypes[categoryField].isDate;
		const shouldUseLine = data.length > 10 || fieldTypes[categoryField].isDate;

		return (
			<div className='h-[400px] mt-4'>
				{chartData.datasets.length === 0 ? (
					<div className='flex items-center justify-center h-full text-gray-500'>
						No numeric data available for visualization
					</div>
				) : shouldUsePie ? (
					<Pie data={chartData} options={options} />
				) : shouldUseLine ? (
					<Line data={chartData} options={options} />
				) : (
					<Bar data={chartData} options={options} />
				)}
			</div>
		);
	} catch (error) {
		console.error('Visualization error:', error);
		return (
			<div className='text-red-500 p-4 bg-red-50 rounded'>
				Unable to visualize data: Invalid or unsupported data format
			</div>
		);
	}
}
