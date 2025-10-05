FROM jupyter/base-notebook:python-3.11.4

WORKDIR /home/jovyan/work

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8888

CMD ["start-notebook.sh", "--NotebookApp.token=''"]
