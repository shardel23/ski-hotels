import Head from "next/head";
import { useEffect, useState } from "react";
import { AiFillStar } from "react-icons/ai";
import DatePicker, { DateObject } from "react-multi-date-picker";
import Select from "react-select";
import { Socket, io } from "socket.io-client";

type HotelImageData = {
  URL: string;
  MainImage?: boolean;
};

type HotelDistanceData = {
  type: string;
  distance: string;
};

type HotelData = {
  HotelCode: string;
  HotelDescriptiveContent: {
    Images: Array<HotelImageData>;
  };
  HotelInfo: {
    Beds: string;
    Position: {
      Distances: Array<HotelDistanceData>;
      Latitude: string;
      Longitude: string;
    };
    Rating: string;
  };
  HotelName: string;
  PricesInfo: {
    AmountAfterTax: string;
    AmountBeforeTax: string;
  };
};

const availableSites = [
  {
    id: 1,
    name: "Val Thorens",
  },
  {
    id: 2,
    name: "Courchevel",
  },
  {
    id: 3,
    name: "Tignes",
  },
  {
    id: 4,
    name: "La Plagne",
  },
  {
    id: 5,
    name: "Chamonix",
  },
  {
    id: 6,
    name: "Les Menuires",
  },
  {
    id: 7,
    name: "L'alpes D'huez",
  },
  {
    id: 8,
    name: "Les Deux Alpes",
  },
];
const siteIdToName = new Map<number, string>();
availableSites.forEach(({ id, name }) => siteIdToName.set(id, name));

const numOfPeopleOptions = Array.from({ length: 10 }, (_, i) => i + 1);

const SOCKET_URL = "http://localhost:4000";

interface ServerToClientEvents {
  data: (data: any) => void;
}

const socket: Socket<ServerToClientEvents, {}> = io(SOCKET_URL);

const defaultStartDate = new DateObject().subtract(2, "days");
const defaultEndDate = new DateObject().add(2, "days");

export default function Home() {
  const [skiSite, setSkiSite] = useState<number | undefined>(1);
  const [numOfPeople, setNumOfPeople] = useState<number>(-1);
  const [results, setResults] = useState<Array<HotelData>>([]);
  const [searchedSkiSiteName, setSearchedSkiSiteName] = useState("");
  const [searchedNumOfPeople, setSearchedNumOfPeople] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [dateValues, setDateValues] = useState([
    defaultStartDate,
    defaultEndDate,
  ]);

  const onSearchClick = () => {
    setSearchedSkiSiteName(siteIdToName.get(skiSite!) ?? "");
    setSearchedNumOfPeople(numOfPeople);
    setResults([]);

    const url = new URL("http://localhost:5000");
    url.searchParams.append("ski_site", skiSite?.toString() ?? "");
    url.searchParams.append("group_size", numOfPeople.toString());
    url.searchParams.append(
      "from_date",
      (dateValues[0] ?? defaultStartDate).format("YYYY-MM-DD")
    );
    url.searchParams.append(
      "to_date",
      (dateValues[1] ?? defaultEndDate).format("YYYY-MM-DD")
    );

    setIsSearching(true);

    fetch(url)
      .catch((err) => console.log(err))
      .finally(() => setIsSearching(false));
  };

  useEffect(() => {
    function onDataEvent(values: any) {
      console.log("data incoming");
      // Need to validate values is an array of HotelData
      setResults((curr) => [...curr, ...values]);
    }

    socket.on("data", onDataEvent);

    return () => {
      socket.off("data", onDataEvent);
    };
  }, []);

  console.log(results);

  return (
    <>
      <Head>
        <title>Ski Hotes</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-between bg-slate-200">
        <div className="flex w-full flex-row items-center justify-between gap-4 bg-white px-16 py-4">
          <div className="mr-12">
            <WeSkiIcon />
          </div>
          <div className="flex flex-grow flex-row justify-between">
            <Select
              className="w-1/3"
              options={availableSites.map((site) => ({
                value: site.id,
                label: site.name,
              }))}
              placeholder="Select ski site..."
              onChange={(e) => {
                setSkiSite(e?.value);
              }}
            />
            <Select
              className="w-1/3"
              options={numOfPeopleOptions.map((option) => ({
                value: option,
                label: option.toString(),
              }))}
              placeholder="Number of people..."
              value={
                numOfPeople > 0
                  ? { value: numOfPeople, label: `${numOfPeople} people` }
                  : null
              }
              onChange={(e) => setNumOfPeople(e?.value ?? 0)}
            />
            <DatePicker
              className="h-full w-1/3"
              value={dateValues}
              onChange={(newValues: DateObject[]) => {
                setDateValues(newValues);
              }}
              range
            />
            <button
              className="w-1/12 rounded-md bg-slate-500 px-4 py-2 text-center text-white"
              onClick={onSearchClick}
              disabled={dateValues.length !== 2 || !skiSite || numOfPeople < 1}
            >
              Search
            </button>
          </div>
        </div>
        <div className="flex flex-col self-start p-16">
          {isSearching && (
            <div className="flex flex-col items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
          {results.length > 0 && (
            <div>
              <div className="mb-4 flex flex-col">
                <h1 className="mb-2 text-2xl font-bold">
                  Select your ski trip
                </h1>
                <div className="text-xs">{results.length} ski trip options</div>
              </div>
              <ul className="flex flex-col gap-4">
                {results.map((res) => {
                  return (
                    <li>
                      <HotelItem
                        hotelData={res}
                        skiSiteName={searchedSkiSiteName}
                        numOfPeople={searchedNumOfPeople}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

const HotelItem = ({
  hotelData,
  skiSiteName,
  numOfPeople,
}: {
  hotelData: HotelData;
  skiSiteName: string;
  numOfPeople: number;
}) => {
  // const mainImageUrl = hotelData.HotelDescriptiveContent.Images.filter(
  //   (content) => content.MainImage
  // )[0]?.URL;
  return (
    <div className="w-screen">
      <div className="flex h-48 w-2/3 flex-row gap-2 bg-slate-100">
        <img
          src={"placeholderImg.jpeg"}
          alt="hotel-image"
          width={280}
          className="rounded-md"
        />
        <div className="flex flex-grow flex-col justify-between p-2">
          <div>
            <span className="font-semibold">{hotelData.HotelName}</span>
            <div className="flex flex-row">
              {Array.from({
                length: Number.parseInt(hotelData.HotelInfo.Rating),
              }).map((_) => (
                <AiFillStar size={12} />
              ))}
            </div>
            <span className="text-xs">{skiSiteName}</span>
          </div>
          <div className="flex flex-col">
            <div className="border"></div>
            <div className="self-end">
              <span className="font-semibold">
                $
                {(
                  Number.parseFloat(hotelData.PricesInfo.AmountAfterTax) /
                  numOfPeople
                ).toFixed(2)}
              </span>
              <span className="text-xs">/per person</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WeSkiIcon = () => {
  return (
    <svg
      width="126"
      height="20"
      viewBox="0 0 126 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M36.0512 7.60084L36.3445 9.95573L36.3377 9.94651L30.2231 2.39056L29.3084 4.55177L31.3781 9.95573L23.1595 0L18.9092 4.16995L28.5269 15.8135L19.1495 9.08079L16.3288 3.96335L0 19.7442H50.9299L36.0512 7.60084Z"
        fill="#1F5CEF"
      />
      <path
        d="M88.5658 15.3708C90.2495 15.3708 91.6144 14.023 91.6144 12.3604C91.6144 10.6979 90.2495 9.3501 88.5658 9.3501C86.8821 9.3501 85.5172 10.6979 85.5172 12.3604C85.5172 14.023 86.8821 15.3708 88.5658 15.3708Z"
        fill="#1F5CEF"
      />
      <path
        d="M71.9113 5.14326L66.3789 19.7461H63.6473L60.3646 10.8786L57.0818 19.7461H54.3502L48.8172 5.14326V4.93114H53.0183L55.9106 13.1425L58.7805 4.93114H61.9486L64.8185 13.1425L67.7108 4.93114H71.9119L71.9113 5.14326Z"
        fill="#1F5CEF"
      />
      <path
        d="M77.2775 7.99988V10.8676H83.3398V13.809H77.2775V16.6767H83.8528V19.7455H73.4711V4.93114H83.8528V7.99988H77.2775Z"
        fill="#1F5CEF"
      />
      <path
        d="M102.089 9.5241C101.484 8.44503 100.454 7.76746 99.1107 7.76746C97.9463 7.76746 97.2296 8.12715 97.2296 8.88896C97.2296 9.62986 97.767 10.0953 100.543 10.8786C103.477 11.7038 105.537 12.7201 105.537 15.5134C105.537 18.6879 102.357 20 99.5808 20C96.5802 20 94.1624 18.667 93.1767 16.127L96.2446 14.4977C97.1624 16.1695 98.3492 16.8888 99.805 16.8888C101.081 16.8888 101.798 16.4658 101.798 15.6616C101.798 14.8149 101.081 14.2646 98.7296 13.5453C96.356 12.8259 93.4899 11.831 93.4899 8.86805C93.4899 5.92659 96.3112 4.67782 99.2446 4.67782C102.401 4.67782 104.35 6.159 105.29 8.06382L102.089 9.5241Z"
        fill="#1F5CEF"
      />
      <path
        d="M120.48 19.6538V19.7227H115.844L110.704 13.3965V19.7455H106.897V4.93114H110.704V10.5607L115.809 4.93114H120.466V5.03689L114.017 11.8938L120.48 19.6538Z"
        fill="#1F5CEF"
      />
      <path d="M126 4.93114V19.7455H122.124V4.93114H126Z" fill="#1F5CEF" />
    </svg>
  );
};

const LoadingSpinner = () => {
  return (
    <div role="status">
      <svg
        aria-hidden="true"
        className="mr-2 h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
};
