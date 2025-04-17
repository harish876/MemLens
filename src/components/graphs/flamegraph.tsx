/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

//@ts-nocheck
import "@pyroscope/flamegraph/dist/index.css";

import { useContext, useEffect } from "react";
import { useState } from "react";
import { FlamegraphRenderer } from "@pyroscope/flamegraph";
import { ProfileData1 } from "@/static/testFlamegraph";
import { Button } from "../ui/button";
import { ViewTypes } from "@pyroscope/flamegraph/dist/packages/pyroscope-flamegraph/src/FlameGraph/FlameGraphComponent/viewTypes";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { TechnicalMarkdownRenderer } from "../ui/MarkdownRenderer";
import { FlamegraphRendererProps } from "@pyroscope/flamegraph/dist/packages/pyroscope-flamegraph/src/FlamegraphRenderer";
import { middlewareApi } from "@/lib/api";
import { Download, RefreshCcw, Flame, Info, Map, Star, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "../ui/loader";
import { NotFound } from "../ui/not-found";
import { ModeContext } from "@/hooks/context";
import { ModeType } from "../toggle";
import { useToast } from "@/hooks/use-toast";
import { useTour } from "@/hooks/use-tour";
import { Tour } from "../ui/tour";

const steps = [
  {
    content: <h2>This is a flamegraph to visualize the stack trace</h2>,
    placement: "center",
    target: "body",
  },
  {
    content: (
      <h2>
        Enter a function name for example "SetValue" to see the functions it
        invokes
      </h2>
    ),
    target: "#function-name",
  },
  {
    content: <h2>Click a function to investigate it in a different mode.</h2>,
    placement: "center",
    target: "body",
  },
  {
    content: (
      <h2>
        Choose the "sandwich" method to explore all functions made by it.
        Explore others as well!
      </h2>
    ),
    target: "#graph-type",
  },
  {
    content: <h2>Click on this button to refresh the data</h2>,
    target: "#refresh",
  },
  {
    content: (
      <h2>Click on this icon to get more info and context on this feature</h2>
    ),
    target: "#info-tip",
  },
];

interface FlamegraphCardProps {
  from: string | number;
  until: string | number;
}
export const Flamegraph = (props: FlamegraphCardProps) => {
  const { toast } = useToast();
  /**
   * UI Client Data
   */

  const mode = useContext<ModeType>(ModeContext);
  const [clientName, setClientName] = useState("cpp_client_1");
  const [profilingData, setProfilingData] = useState(ProfileData1);

  function handleClientNameChange(value: string) {
    setClientName(value);
  }

  /**
   * UI Client State
   */
  const [flamegraphDisplayType, setFlamegraphDisplayType] =
    useState<ViewTypes>("both");
  const [flamegraphInterval, setFlamegraphInterval] =
    useState<string>("now-5m");
  const [_, setSearchQueryToggle] = useState(true); //dummy dispatch not used functionally
  const [refresh, setRefresh] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setSearchQuery] = useState<
    FlamegraphRendererProps["sharedQuery"]
  >({
    searchQuery: "",
    onQueryChange: (value: any) => {},
    syncEnabled: true,
    toggleSync: setSearchQueryToggle,
  });
  const [explainFGLoading, setExplainFGLoading] = useState(false);
  const [explanationData, setExplanationData] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleFlamegraphTypeChange(value: string) {
    setFlamegraphDisplayType(value);
  }

  function handleFlamegraphIntervalChange(value: string) {
    setFlamegraphInterval(value);
  }

  async function explainFlamegraph() {
    const from = props.from || flamegraphInterval;
    const until = props.until || "now";

    // Send the serialized data to /explainFlamegraph
    try {
      setExplainFGLoading(true);
      const response = await middlewareApi.post(
        "/pyroscope/explainFlamegraph",
        {
          query: clientName,
          from: from,
          until: until,
        }
      );
      setExplainFGLoading(false);
      console.log(response?.data);
      setExplanationData(response?.data);
      setDialogOpen(true);

      toast({
        title: "ExplainFlamegraph Response",
        description: `Received response: Success`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "ExplainFlamegraph Response",
        description: `Received response: Failure. Unable to recieve response ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setExplainFGLoading(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function base64ToBlob(
    base64Data: string,
    contentType: string = "application/octet-stream"
  ): Blob {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset++) {
      byteArrays.push(byteCharacters.charCodeAt(offset));
    }
    return new Blob([new Uint8Array(byteArrays)], { type: contentType });
  }

  function handleDownload() {
    const jsonData = JSON.stringify(profilingData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function refreshFlamegraph() {
    setRefresh((prev) => !prev);
  }

  const { startTour, setSteps } = useTour();

  useEffect(() => {
    setSteps(steps);
  }, []);

  useEffect(() => {
    if (mode === "offline") {
      setProfilingData(ProfileData1);
      toast({
        title: "Offline Mode",
        description: "Using sample data in offline mode.",
        variant: "default",
      });
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        let from: string | number = flamegraphInterval;
        let until: string | number = "now";
        if (props.from && props.until) {
          from = props.from;
          until = props.until;
        }
        const response = await middlewareApi.post("/pyroscope/getProfile", {
          query: clientName,
          from: from,
          until: until,
        });
        if (response?.data?.error) {
          setError(response?.data?.error);
          toast({
            title: "Error",
            description: response?.data?.error,
            variant: "destructive",
          });
          setError(response?.data?.error);
        } else {
          setProfilingData(response?.data);
          toast({
            title: "Data Updated",
            description: `Flamegraph data updated for ${clientName}`,
            variant: "default",
          });
        }
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setError(error?.message);
      }
    };
    fetchData();
  }, [clientName, refresh, props.from, props.until, mode, flamegraphInterval]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Card className="w-full max-w-8xl mx-auto bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl">
        <Tour />
        <CardHeader>
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-blue-400" />
              <CardTitle className="text-2xl font-bold">Flamegraph</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={refreshFlamegraph}>
                <RefreshCcw id="refresh" />
              </Button>
              <button
                onClick={startTour}
                className="p-2 bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors duration-200 ease-in-out rounded"
              >
                <Map id="tour-tip" size={16} />
              </button>
              <a
                target="_blank"
                href="https://pyroscope.io/blog/what-is-a-flamegraph/"
                className="p-2 bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors duration-200 ease-in-out rounded"
              >
                <Info id="info-tip" size={16} />
              </a>
              <Button
                id="analyze-graph"
                variant="outline"
                onClick={explainFlamegraph}
              >
                {explainFGLoading ? <Loader /> : <Star />}
                Explain this profile
              </Button>
              <DialogContent className="max-w-5xl bg-slate-800 border border-slate-700 text-white shadow-xl backdrop-blur-sm">
                <DialogHeader className="flex justify-between items-start pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-slate-700 hover:bg-slate-600 absolute top-2 right-2"
                    onClick={() => setDialogOpen(false)}
                  >
                    <X />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[70vh] w-full">
                  {explanationData ? (
                    <TechnicalMarkdownRenderer markdown={explanationData} />
                  ) : (
                    <div className="flex items-center justify-center p-8">
                      <Loader />
                    </div>
                  )}
                </div>
              </DialogContent>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col h-full gap-4">
          {error ? (
            <NotFound onRefresh={refreshFlamegraph} />
          ) : (
            <div>
              <div className="flex justify-between mb-4">
                <div className="flex flex-row space-x-2">
                  <Input
                    id="function-name"
                    placeholder="Filter by function name"
                    onChange={(e) =>
                      setSearchQuery((prev) => {
                        return {
                          ...prev,
                          searchQuery: e.target.value,
                        };
                      })
                    }
                    className="w-64 bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="flex flex-row space-x-2">
                  <Button
                    id="download-graph"
                    variant="outline"
                    size="icon"
                    onClick={handleDownload}
                  >
                    <Download />
                  </Button>

                  <Select onValueChange={handleClientNameChange}>
                    <SelectTrigger className="w-[120px] h-[30px]">
                      <SelectValue placeholder="App Name" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpp_client_1">
                        Current Primary (P)
                      </SelectItem>{" "}
                      {/* TODO: remove static coding */}
                      <SelectItem value="cpp_client_2">
                        Secondary-1
                      </SelectItem>{" "}
                      {/* TODO: remove static coding */}
                      <SelectItem value="system">Host</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select onValueChange={handleFlamegraphTypeChange}>
                    <SelectTrigger
                      className="w-[120px] h-[30px]"
                      id="graph-type"
                    >
                      <SelectValue placeholder="Graph Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="flamegraph">Flamegraph</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                      <SelectItem value="sandwich">Sandwich</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select onValueChange={handleFlamegraphIntervalChange}>
                    <SelectTrigger className="w-[120px] h-[30px]">
                      <SelectValue placeholder="Interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now-5m">Last 5 minutes</SelectItem>
                      <SelectItem value="now-30m">Last 30 minutes</SelectItem>
                      <SelectItem value="now-1h">Last 1 hour</SelectItem>
                      <SelectItem value="now-12h">Last 12 hours</SelectItem>
                      <SelectItem value="now-24h">Last 24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex-1 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                {loading ? (
                  <Loader className="h-[800px] p-4" />
                ) : (
                  <FlamegraphRenderer
                    id="flamegraph"
                    key={flamegraphDisplayType} // Force a re-render when the type changes
                    profile={profilingData}
                    showCredit={false}
                    panesOrientation="horizontal"
                    onlyDisplay={flamegraphDisplayType}
                    showToolbar={true}
                    colorMode="dark"
                    sharedQuery={query}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Dialog>
  );
};
