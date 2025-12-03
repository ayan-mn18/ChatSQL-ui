import { Database, Table, HardDrive, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
  ArcElement
);

export default function ConnectionOverview() {
  // Operations Data (Line Chart)
  const operationsData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Insertions',
        data: [65, 59, 80, 81, 56, 55, 40],
        borderColor: '#10b981', // Green
        backgroundColor: '#10b981',
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Deletions',
        data: [28, 48, 40, 19, 86, 27, 90],
        borderColor: '#ef4444', // Red
        backgroundColor: '#ef4444',
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // Data Growth Data (Area Chart)
  const dataGrowthData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Data Size (MB)',
        data: [120, 132, 145, 160, 178, 195, 210],
        borderColor: '#3b82f6', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#1B2431',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 2,
      },
    ],
  };

  // Query Distribution (Doughnut)
  const queryDistributionData = {
    labels: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    datasets: [
      {
        data: [65, 20, 10, 5],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        cutout: '75%',
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' },
        border: { display: false },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 overflow-y-auto h-full">
      <h1 className="text-2xl md:text-3xl font-bold text-white">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-[#273142] border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Tables</CardTitle>
            <Table className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">12</div>
            <p className="text-xs text-gray-500 mt-1">+2 from last week</p>
          </CardContent>
        </Card>
        <Card className="bg-[#273142] border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Database Size</CardTitle>
            <HardDrive className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">2.4 GB</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +120 MB
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#273142] border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Connections</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">4</div>
            <p className="text-xs text-gray-500 mt-1">Stable</p>
          </CardContent>
        </Card>
        <Card className="bg-[#273142] border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Query Time</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">45ms</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowDownRight className="w-3 h-3 mr-1" />
              -12%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Operations Chart */}
        <Card className="col-span-1 lg:col-span-2 bg-[#273142] border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Database Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line data={operationsData} options={commonOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Query Distribution */}
        <Card className="bg-[#273142] border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Query Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] relative">
              <Doughnut data={queryDistributionData} options={doughnutOptions} />
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-bold text-white">85%</span>
                <span className="text-xs text-gray-400">Reads</span>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> SELECT
                </span>
                <span className="text-white font-medium">65%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> INSERT
                </span>
                <span className="text-white font-medium">20%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> UPDATE
                </span>
                <span className="text-white font-medium">10%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> DELETE
                </span>
                <span className="text-white font-medium">5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Growth Chart */}
        <Card className="col-span-1 lg:col-span-3 bg-[#273142] border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Data Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line data={dataGrowthData} options={commonOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
