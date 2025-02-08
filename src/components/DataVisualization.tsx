
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
  if (!data.length) return null;

  const fields = Object.keys(data[0]);
  const numericFields = fields.filter(field =>
    !isNaN(Number(data[0][field].replace(/,/g, '')))
  );
  const categoryFields = fields.filter(field =>
    isNaN(Number(data[0][field].replace(/,/g, '')))
  );

  if (numericFields.length === 0 || categoryFields.length === 0) {
    return null;
  }

  const categoryField = categoryFields[0];
  const labels = data.map(item => item[categoryField]);

  const chartData = {
    labels,
    datasets: numericFields.map((field, index) => ({
      label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      data: data.map(item => Number(item[field].replace(/,/g, ''))),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
      ][index % 5],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
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
        text: `${categoryField.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
      },
    },
  };

  // Choose chart type based on data characteristics
  const shouldUsePie = data.length <= 10 && numericFields.length === 1;
  const shouldUseLine = data.length > 10 || labels.every(label => !isNaN(Date.parse(label)));

  return (
    <div className="h-[400px] mt-4">
      {shouldUsePie ? (
        <Pie data={chartData} options={options} />
      ) : shouldUseLine ? (
        <Line data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
}