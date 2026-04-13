import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm font-mono my-3">
    <code>{children}</code>
  </pre>
);

const Tutorial = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-2">Python Control Structures</h1>
        <p className="text-muted-foreground mb-8">Learn how to control the flow of your Python programs</p>

        {/* Section 1 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1️⃣ What Are Control Structures?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Control structures decide:</p>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>What code runs</li>
              <li>When it runs</li>
              <li>How many times it runs</li>
            </ul>
            <p className="font-medium">There are three main types:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Conditional statements</li>
              <li>Loops</li>
              <li>Control flow keywords</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 2 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2️⃣ Conditional Statements (Decision Making)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 if statement</h3>
              <p className="mb-2">Runs code only if a condition is true.</p>
              <CodeBlock>{`age = 18

if age >= 18:
    print("You are allowed to vote")`}</CodeBlock>
              <p className="text-sm text-muted-foreground">📌 Note: Indentation is very important. Condition must be True or False.</p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 if...else</h3>
              <p className="mb-2">Runs one block if true, another if false.</p>
              <CodeBlock>{`marks = 45

if marks >= 50:
    print("Pass")
else:
    print("Fail")`}</CodeBlock>
              <p className="text-sm text-muted-foreground">🧠 Program must choose one path</p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 if...elif...else</h3>
              <p className="mb-2">Used when there are multiple conditions</p>
              <CodeBlock>{`score = 75

if score >= 80:
    print("Grade A")
elif score >= 60:
    print("Grade B")
elif score >= 40:
    print("Grade C")
else:
    print("Fail")`}</CodeBlock>
              <p className="text-sm text-muted-foreground">📌 Conditions are checked top to bottom. Only one block runs.</p>
            </div>

            <Separator />

            <div className="bg-primary/10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">📝 Student Practice</h4>
              <p>Write a program that checks age and prints:</p>
              <ul className="list-disc list-inside mt-2">
                <li>"Child" if below 13</li>
                <li>"Teen" if 13–19</li>
                <li>"Adult" if above 19</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 3 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3️⃣ Comparison & Logical Operators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 Comparison Operators</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="border p-2 text-left">Operator</th>
                      <th className="border p-2 text-left">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border p-2 font-mono">==</td><td className="border p-2">equal</td></tr>
                    <tr><td className="border p-2 font-mono">!=</td><td className="border p-2">not equal</td></tr>
                    <tr><td className="border p-2 font-mono">&gt;</td><td className="border p-2">greater than</td></tr>
                    <tr><td className="border p-2 font-mono">&lt;</td><td className="border p-2">less than</td></tr>
                    <tr><td className="border p-2 font-mono">&gt;=</td><td className="border p-2">greater or equal</td></tr>
                    <tr><td className="border p-2 font-mono">&lt;=</td><td className="border p-2">less or equal</td></tr>
                  </tbody>
                </table>
              </div>
              <CodeBlock>{`print(5 > 3)   # True
print(4 == 6)  # False`}</CodeBlock>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 Logical Operators</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="border p-2 text-left">Operator</th>
                      <th className="border p-2 text-left">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border p-2 font-mono">and</td><td className="border p-2">both conditions true</td></tr>
                    <tr><td className="border p-2 font-mono">or</td><td className="border p-2">at least one true</td></tr>
                    <tr><td className="border p-2 font-mono">not</td><td className="border p-2">opposite</td></tr>
                  </tbody>
                </table>
              </div>
              <CodeBlock>{`age = 20
student = True

if age >= 18 and student:
    print("Eligible for student discount")`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Section 4 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>4️⃣ Loops (Repetition)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">🔁 Why Loops?</h3>
              <p>To avoid repeating code manually.</p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 while loop</h3>
              <p className="mb-2">Repeats while condition is true</p>
              <CodeBlock>{`count = 1

while count <= 5:
    print(count)
    count += 1`}</CodeBlock>
              <p className="text-sm text-muted-foreground">🧠 Must update the variable. Otherwise → infinite loop</p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 for loop</h3>
              <p className="mb-2">Used when you know how many times to loop.</p>
              <CodeBlock>{`for i in range(1, 6):
    print(i)`}</CodeBlock>
              <p className="text-sm text-muted-foreground">📌 range(start, stop) - Stop value is not included</p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 Looping through a list</h3>
              <CodeBlock>{`continents = ["Africa", "Europe", "Asia"]

for continent in continents:
    print(continent)`}</CodeBlock>
            </div>

            <div className="bg-primary/10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">📝 Student Practice</h4>
              <ul className="list-disc list-inside">
                <li>Print numbers from 10 to 1 using a loop</li>
                <li>Print all items in a list of fruits</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 5 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5️⃣ Control Flow Keywords</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 break</h3>
              <p className="mb-2">Stops the loop immediately</p>
              <CodeBlock>{`for i in range(1, 10):
    if i == 5:
        break
    print(i)`}</CodeBlock>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 continue</h3>
              <p className="mb-2">Skips the current iteration</p>
              <CodeBlock>{`for i in range(1, 6):
    if i == 3:
        continue
    print(i)`}</CodeBlock>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 pass</h3>
              <p className="mb-2">Does nothing (placeholder)</p>
              <CodeBlock>{`if True:
    pass`}</CodeBlock>
              <p className="text-sm text-muted-foreground">📌 Useful when planning code</p>
            </div>
          </CardContent>
        </Card>

        {/* Section 6 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6️⃣ Nested Control Structures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 if inside a loop</h3>
              <CodeBlock>{`for i in range(1, 11):
    if i % 2 == 0:
        print(i, "is even")`}</CodeBlock>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">🔹 Loop inside a loop</h3>
              <CodeBlock>{`for i in range(1, 4):
    for j in range(1, 4):
        print(i, j)`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Section 7 - Mini Project */}
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle>7️⃣ Mini Project: Simple Login System 🎯</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock>{`password = "python123"
attempts = 3

while attempts > 0:
    user_input = input("Enter password: ")

    if user_input == password:
        print("Login successful")
        break
    else:
        attempts -= 1
        print("Wrong password. Attempts left:", attempts)

if attempts == 0:
    print("Account locked")`}</CodeBlock>
            <div className="bg-primary/10 rounded-lg p-4 mt-4">
              <h4 className="font-semibold mb-2">📌 This project teaches:</h4>
              <ul className="list-disc list-inside">
                <li>while loop</li>
                <li>if...else</li>
                <li>break</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tutorial;
