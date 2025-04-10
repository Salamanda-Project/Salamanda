import { Text, Heading } from "../../components";
import LaunchInfoSection from "../../components/LaunchInfoSection";
import React, { Suspense } from "react";

const reasonsGrid = [
  {
    headerText: "Why you should launch on Salamanda",
    descriptionText:
      "Sed vitae lacus tincidunt, ultrices nisl nec, lobortis est. In laoreet, est a aliquam sodales, massa metus posuere purus, ut semper purus odio eget massa. Pellentesque quis sagittis quam, nec interdum nisl. Maecenas feugiat, velit vel posuere malesuada, mi tortor iaculis augue, vel vulputate massa mauris id libero",
  },
  {
    headerText: "Why you should launch on Salamanda",
    descriptionText:
      "Sed vitae lacus tincidunt, ultrices nisl nec, lobortis est. In laoreet, est a aliquam sodales, massa metus posuere purus, ut semper purus odio eget massa. Pellentesque quis sagittis quam, nec interdum nisl. Maecenas feugiat, velit vel posuere malesuada, mi tortor iaculis augue, vel vulputate massa mauris id libero",
  },
  {
    headerText: "Why you should launch on Salamanda",
    descriptionText:
      "Sed vitae lacus tincidunt, ultrices nisl nec, lobortis est. In laoreet, est a aliquam sodales, massa metus posuere purus, ut semper purus odio eget massa. Pellentesque quis sagittis quam, nec interdum nisl. Maecenas feugiat, velit vel posuere malesuada, mi tortor iaculis augue, vel vulputate massa mauris id libero",
  },
  {
    headerText: "Why you should launch on Salamanda",
    descriptionText:
      "Sed vitae lacus tincidunt, ultrices nisl nec, lobortis est. In laoreet, est a aliquam sodales, massa metus posuere purus, ut semper purus odio eget massa. Pellentesque quis sagittis quam, nec interdum nisl. Maecenas feugiat, velit vel posuere malesuada, mi tortor iaculis augue, vel vulputate massa mauris id libero",
  },
  {
    headerText: "Why you should launch on Salamanda",
    descriptionText:
      "Sed vitae lacus tincidunt, ultrices nisl nec, lobortis est. In laoreet, est a aliquam sodales, massa metus posuere purus, ut semper purus odio eget massa. Pellentesque quis sagittis quam, nec interdum nisl. Maecenas feugiat, velit vel posuere malesuada, mi tortor iaculis augue, vel vulputate massa mauris id libero",
  },
  {
    headerText: "Why you should launch on Salamanda",
    descriptionText:
      "Sed vitae lacus tincidunt, ultrices nisl nec, lobortis est. In laoreet, est a aliquam sodales, massa metus posuere purus, ut semper purus odio eget massa. Pellentesque quis sagittis quam, nec interdum nisl. Maecenas feugiat, velit vel posuere malesuada, mi tortor iaculis augue, vel vulputate massa mauris id libero",
  },
];

export default function WhyLaunchSection() {
  return (
    <>
      {/* why launch section */}
      <div className="mt-[342px] flex flex-col items-center">
        <div className="container-xs flex flex-col gap-16 md:px-5 sm:gap-8">
          <div className="flex flex-col items-center gap-4 px-14 md:px-5">
            <Heading
              size="heading_heading_xl"
              as="h2"
              className="text-[40px] font-bold md:text-[38px] sm:text-[36px]"
            >
              Why you should launch on Salamanda
            </Heading>
            <Text size="body_body_lg_default" as="p" className="text-[20px] font-normal">
              We hope this answers your questions
            </Text>
          </div>
          <div className="grid grid-cols-3 justify-center gap-6 md:grid-cols-2 sm:grid-cols-1">
            <Suspense fallback={<div>Loading feed...</div>}>
              {reasonsGrid.map((d, index) => (
                <LaunchInfoSection {...d} key={"reasonstack" + index} />
              ))}
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
