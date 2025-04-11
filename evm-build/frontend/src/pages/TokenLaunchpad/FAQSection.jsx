import { Img, Heading, Text } from "../../components";
import React from "react";
import {
  AccordionItemPanel,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemState,
  Accordion,
  AccordionItem,
} from "react-accessible-accordion";

const accordionData = [
  {
    timeZone:
      "Morbi a purus egestas, mollis est vel, sagittis ipsum. In viverra leo non urna mollis, quis placerat neque faucibus?",
  },
  {
    timeZone:
      "Morbi a purus egestas, mollis est vel, sagittis ipsum. In viverra leo non urna mollis, quis placerat neque faucibus?",
  },
  {
    timeZone:
      "Morbi a purus egestas, mollis est vel, sagittis ipsum. In viverra leo non urna mollis, quis placerat neque faucibus?",
  },
  {
    timeZone:
      "Morbi a purus egestas, mollis est vel, sagittis ipsum. In viverra leo non urna mollis, quis placerat neque faucibus?",
  },
  {
    timeZone:
      "Morbi a purus egestas, mollis est vel, sagittis ipsum. In viverra leo non urna mollis, quis placerat neque faucibus?",
  },
];

export default function FAQsSection() {
  return (
    <div className="relative">
      {/* f a qs section */}
      <div className="mt-20 flex flex-col items-center pb-20"> {/* Added pb-20 for bottom padding */}
        <div className="container-xs flex flex-col gap-8 md:px-5">
          <div className="flex flex-col items-start gap-4">
            <a href="FAQs" target="_blank" rel="noreferrer" className="md:text-[48px] sm:text-[42px]">
              <Heading size="heading_heading_2xl" as="h2" className="text-[56px] font-black">
                FAQs
              </Heading>
            </a>
            <Text size="body_body_lg_default" as="p" className="text-[20px] font-normal">
              We hope this answers your questions
            </Text>
          </div>
          <Accordion className="flex flex-col gap-4">
            {accordionData.map((d, i) => (
              <AccordionItem uuid={i} key={`faqstack${i}`}>
                <AccordionItemHeading className="w-full">
                  <AccordionItemButton>
                    <AccordionItemState>
                      {(props) => (
                        <>
                          <div className="flex flex-1 items-center justify-between gap-5 rounded-[14px] bg-black-900_01 p-6 md:flex-col sm:p-5">
                            <Heading size="heading_heading_sm" as="h3" className="text-[18px] font-semibold">
                              {d.timeZone}
                            </Heading>
                            <Img src="images/img_arrowdown.svg" alt="Arrowdown" className="h-[24px] md:w-full" />
                          </div>
                        </>
                      )}
                    </AccordionItemState>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div>Dummy Content</div>
                </AccordionItemPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      
      {/* Overflow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black-900_02 to-transparent -z-10"></div>
    </div>
  );
}