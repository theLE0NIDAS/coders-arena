from rest_framework.response import Response


class CompilerJsonResponse():
    def __init__(self, result: str, details: str, status: int, verdictCode: int):
        self.result = result
        self.details = details
        self.status = status
        self.verdictCode = verdictCode

    def build(self):
        return Response(
            data={
                "result": self.result,
                "details": self.details,
                "verdictCode": self.verdictCode
            },
            status=self.status
        )
